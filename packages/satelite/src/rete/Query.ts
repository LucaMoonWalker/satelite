import { extractBindingsFromCondition, ParsedCondition } from "./Condition";
import { IFact } from "./Fact";
import { QueryNode } from "./nodes/QueryNode";
import { IVariableBindings } from "./Token";

export type IQueryChangeFn = (
  facts: IFact[],
  variableBindings: IVariableBindings[],
) => any;

export class Query {
  static create(conditions: ParsedCondition[]) {
    return new Query(conditions);
  }

  queryNode: QueryNode;
  callbacks: Set<IQueryChangeFn> = new Set();
  conditions: ParsedCondition[] = [];
  lastCondition: ParsedCondition;

  constructor(conditions: ParsedCondition[]) {
    this.conditions = conditions;
    this.lastCondition = this.conditions[this.conditions.length - 1];
  }

  getFacts(): IFact[] {
    return this.queryNode && this.queryNode.facts ? this.queryNode.facts : [];
  }

  getVariableBindings(): IVariableBindings[] {
    return this.queryNode && this.queryNode.items
      ? this.queryNode.items.map(t => {
          let bindings = t.bindings;
          if (this.lastCondition) {
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

  didChange(): void {
    const factTuples = this.getFacts();
    const variableBindings = this.getVariableBindings();

    for (const callback of this.callbacks) {
      callback(factTuples, variableBindings);
    }
  }

  onChange(
    cb: (facts: IFact[], variableBindings: IVariableBindings[]) => any,
  ): void {
    this.callbacks.add(cb);
  }

  offChange(
    cb: (facts: IFact[], variableBindings: IVariableBindings[]) => any,
  ): void {
    this.callbacks.delete(cb);
  }
}
