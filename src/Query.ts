import map = require("lodash/map");
import { extractBindingsFromCondition, ParsedCondition } from "./Condition";
import { IFact } from "./Fact";
import { QueryNode } from "./nodes/QueryNode";
import { IVariableBindings } from "./Token";

export type IQueryChangeFn = (
  facts: IFact[],
  variableBindings: IVariableBindings[],
) => any;

let nextQueryId = 0;
export class Query {
  static create(conditions: ParsedCondition[]) {
    return new Query(conditions);
  }

  id = nextQueryId++;
  queryNode: QueryNode;
  callbacks: Set<IQueryChangeFn> = new Set();
  conditions: ParsedCondition[] = [];
  lastCondition: ParsedCondition;
  facts: IFact[];
  variableBindings: IVariableBindings[];

  constructor(conditions: ParsedCondition[]) {
    this.conditions = conditions;
    this.lastCondition = this.conditions[this.conditions.length - 1];
  }

  didChange(): void {
    this.facts = this.getFacts();
    this.variableBindings = this.getVariableBindings();

    for (const callback of this.callbacks) {
      callback(this.facts, this.variableBindings);
    }
  }

  onChange(cb: IQueryChangeFn): void {
    this.callbacks.add(cb);
  }

  then(cb: IQueryChangeFn): void {
    this.onChange(cb);
  }

  offChange(cb: IQueryChangeFn): void {
    this.callbacks.delete(cb);
  }

  private getFacts(): IFact[] {
    return this.queryNode && this.queryNode.items
      ? map(this.queryNode.items, t => t.fact)
      : [];
  }

  private getVariableBindings(): IVariableBindings[] {
    return this.queryNode && this.queryNode.items
      ? map(this.queryNode.items, t => {
          let bindings = t.bindings;
          if (this.lastCondition && t.fact) {
            bindings = extractBindingsFromCondition(
              this.lastCondition,
              t.fact,
              bindings,
            );
          }
          return bindings;
        })
      : [];
  }
}
