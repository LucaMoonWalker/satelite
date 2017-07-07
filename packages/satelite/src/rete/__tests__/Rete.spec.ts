import { IFactTuple } from "../Fact";
import { makeIdentifier } from "../Identifier";
import { acc, not, Rete } from "../Rete";

const thomas = makeIdentifier("person", 1);
const violet = makeIdentifier("person", 2);
const marc = makeIdentifier("person", 3);
const grace = makeIdentifier("person", 4);

const DATA_SET: IFactTuple[] = [
  [thomas, "name", "Thomas"],
  [thomas, "gender", "M"],
  [thomas, "team", "WW"],

  [violet, "name", "Violet"],
  [violet, "gender", "F"],
  [violet, "team", "Spirit"],

  [marc, "name", "Marc"],
  [marc, "gender", "M"],
  [marc, "team", "Content"],

  [grace, "name", "Grace"],
  [grace, "gender", "F"],
  [grace, "team", "Fun"],
] as any;

describe("Rete", () => {
  it("should add a production", () => {
    expect.assertions(4);

    const { addFact, addProduction } = Rete.create();

    for (let i = 0; i < DATA_SET.length; i++) {
      addFact(DATA_SET[i]);
    }

    addProduction(
      [["?e", "gender", "F"], ["?e", "team", "Fun"], ["?e", "name", "?v"]],
      ({ e, v }) => {
        expect(e).toBe(grace);
        expect(v).toBe("Grace");
      },
    );

    addProduction(
      [["?e", "gender", "M"], ["?e", "team", "WW"], ["?e", "name", "?v"]],
      ({ e, v }) => {
        expect(e).toBe(thomas);
        expect(v).toBe("Thomas");
      },
    );
  });

  it("should allow negative conditions", () => {
    expect.assertions(2);

    const { addFact, addProduction } = Rete.create();

    for (let i = 0; i < DATA_SET.length; i++) {
      addFact(DATA_SET[i]);
    }

    addProduction(
      [["?e", "gender", "F"], not(["?e", "team", "Fun"]), ["?e", "name", "?v"]],
      ({ e, v }) => {
        expect(e).toBe(violet);
        expect(v).toBe("Violet");
      },
    );
  });

  it("should be able to remove fact", () => {
    expect.assertions(3);

    const { addFact, removeFact, addProduction } = Rete.create();

    for (let i = 0; i < DATA_SET.length; i++) {
      addFact(DATA_SET[i]);
    }

    addProduction(
      [["?e", "gender", "F"], ["?e", "name", "?v"]],
      ({ e, v }, { addProducedFact }) => {
        if (e === violet) {
          expect(v).toBe("Violet");
          addProducedFact([e, "isLady", true]);
        } else {
          expect(v).toBe("Grace");
        }
      },
    );

    removeFact(DATA_SET[4]);

    addProduction([["?e", "gender", "F"], ["?e", "name", "?v"]], ({ v }) => {
      expect(v).toBe("Grace");
    });
  });

  it("should be able to have dependent facts", () => {
    expect.assertions(4);

    const { addFact, addProduction } = Rete.create();

    for (let i = 0; i < DATA_SET.length; i++) {
      addFact(DATA_SET[i]);
    }

    addProduction([["?e", "isLady", true]], ({ e }, { fact }) => {
      expect(fact).toEqual([violet, "isLady", true]);
      expect(e).toBe(violet);
    });

    addProduction(
      [["?e", "gender", "F"], ["?e", "name", "?v"]],
      ({ e, v }, { addProducedFact }) => {
        if (e === violet) {
          expect(v).toBe("Violet");
          addProducedFact([e, "isLady", true]);
        } else {
          expect(v).toBe("Grace");
        }
      },
    );
  });

  it("should allow queries", () => {
    const { addFact, removeFact, addProduction, addQuery } = Rete.create();

    for (let i = 0; i < DATA_SET.length; i++) {
      addFact(DATA_SET[i]);
    }

    addProduction([["?e", "gender", "F"]], ({ e }, { addProducedFact }) => {
      addProducedFact([e, "isLady", true]);

      addFact([thomas, "superCool", true]);
    });

    const coolQuery = addQuery([["?e", "superCool", true]]);
    const ladyQuery = addQuery([["?e", "isLady", true]]);

    let coolFacts;
    let ladyFacts;
    let ladyVariableBindings;

    coolFacts = coolQuery.getFacts();
    expect(coolFacts).toHaveLength(1);
    expect(coolFacts[0][0]).toBe(thomas);

    ladyFacts = ladyQuery.getFacts();
    expect(ladyFacts).toHaveLength(2);
    expect(ladyFacts[0][0]).toBe(grace);
    expect(ladyFacts[1][0]).toBe(violet);

    ladyVariableBindings = ladyQuery.getVariableBindings();
    expect(ladyVariableBindings[0].e).toBe(grace);
    expect(ladyVariableBindings[1].e).toBe(violet);

    removeFact(DATA_SET[10] as any);

    ladyFacts = ladyQuery.getFacts();
    expect(ladyFacts).toHaveLength(1);
    expect(ladyFacts[0][0]).toBe(violet);

    ladyVariableBindings = ladyQuery.getVariableBindings();
    expect(ladyVariableBindings[0].e).toBe(violet);

    removeFact(DATA_SET[4] as any);

    ladyFacts = ladyQuery.getFacts();
    expect(ladyFacts).toHaveLength(0);

    coolFacts = coolQuery.getFacts();
    expect(coolFacts).toHaveLength(1);
    expect(coolFacts[0][0]).toBe(thomas);
  });

  it("should be able to accumulate facts", () => {
    expect.assertions(1);

    const { addFact, addProduction } = Rete.create();

    for (let i = 0; i < DATA_SET.length; i++) {
      addFact(DATA_SET[i]);
    }

    addProduction(
      [["?e", "gender", "F"], acc("?count", acc => acc, 5)],
      ({ count }) => {
        expect(count).toBe(5);
      },
    );
  });
});
