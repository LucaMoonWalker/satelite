import { memoize } from "interstelar";
import { IIdentifier, IPrimitive } from "./Identifier";
import { IAlphaMemoryNode } from "./nodes/AlphaMemoryNode";
// import { INegativeJoinResult } from "./nodes/NegativeNode";
// import { IToken } from "./Token";
import { IList } from "./util";

export type IValue = any;

export type IFactFields = "identifier" | "attribute" | "value";

export type IFactTuple = [IIdentifier | IPrimitive, string, IValue];

export interface IFact {
  identifier: IIdentifier | IPrimitive;
  attribute: string;
  value: IValue;

  alphaMemories: IList<IAlphaMemoryNode>;
  [key: string]: any;
  // tokens: IList<IToken>;

  // negativeJoinResults: IList<INegativeJoinResult>;
}

export function makeFactPure(
  identifier: IIdentifier | IPrimitive,
  attribute: string,
  value: IValue,
): IFact {
  const f: IFact = Object.create(null);

  f.identifier = identifier;
  f.attribute = attribute;
  f.value = value;

  // f.tokens = null;
  // f.negativeJoinResults = null;

  return f;
}

export const makeFact = memoize(makeFactPure);

export function compareFacts(f1: IFact, f2: IFact): boolean {
  return (
    f1.identifier === f2.identifier &&
    f1.attribute === f2.attribute &&
    f1.value === f2.value
  );
}

export function makeFactTuple(f: IFact): IFactTuple {
  return [f.identifier, f.attribute, f.value];
}
