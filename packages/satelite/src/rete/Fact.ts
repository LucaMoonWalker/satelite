import { IIdentifier } from "./Identifier";
import { IAlphaMemoryItem } from "./nodes/AlphaMemoryNode";
import { INegativeJoinResult } from "./nodes/NegativeNode";
import { IToken } from "./Token";
import { IList } from "./util";

export type IValue = any;

export type IFactFields = "identifier" | "attribute" | "value";

export interface IFact {
  identifier: IIdentifier;
  attribute: string;
  value: IValue;

  alphaMemoryItems: IList<IAlphaMemoryItem>;
  tokens: IList<IToken>;

  negativeJoinResults: IList<INegativeJoinResult>;
}

export function makeFact(
  identifier: IIdentifier,
  attribute: string,
  value: IValue,
): IFact {
  const f: IFact = Object.create(null);

  f.identifier = identifier;
  f.attribute = attribute;
  f.value = value;

  f.alphaMemoryItems = null;
  f.tokens = null;
  f.negativeJoinResults = null;

  return f;
}

export function compareFacts(f1: IFact, f2: IFact): boolean {
  return (
    f1.identifier === f2.identifier &&
    f1.attribute === f2.attribute &&
    f1.value === f2.value
  );
}
