export interface IState {
  [key: string]: any;
}

export interface IActions {
  [fn: string]: (...args: any[]) => void;
}

export type IMapStateToActions<S, C, A> = (state: S, computed: C) => A;
export type IMapStateToBoundMethods<S, C, B> = (
  state: Readonly<S>,
  computed: C
) => B;
export type IMapStateToComputed<S, C> = (state: S) => C;

export interface ICreateStoreCreatorOptions<S, C, A> {
  state: S;
  computed?: IMapStateToComputed<Readonly<S>, C>;
  actions?: IMapStateToActions<S, C, A>;
}

export type IChangeCallback<S, K = keyof S> = (state: S, key: K) => any;

export type IStoreInstance<S, C, A, B> = {
  state: Readonly<S>;
  computed: Readonly<C>;
  onChange(cb: IChangeCallback<S>): void;
  offChange(cb: IChangeCallback<S>): void;
} & A &
  B;

export type IStoreCreator<S, C, A, B> = (
  initialState?: S
) => IStoreInstance<S, C, A, B>;

function createStateProxy<T extends IState>(
  state: T,
  onChange: (key: PropertyKey) => void
): T {
  return new Proxy(state, {
    get(target, key) {
      return target[key];
    },

    set(target, key, value) {
      if (target[key] !== value) {
        target[key] = value;
        onChange(key);
      }

      return true;
    }
  });
}

function createReadonlyStateProxy<T extends IState>(state: T): Readonly<T> {
  return new Proxy(state, {
    get(target, key) {
      return target[key];
    },

    set(target, key) {
      if (target.hasOwnProperty(key)) {
        throw new Error(`Cannot directly modify state object. ${key}`);
      }

      return false;
    }
  });
}

export function createStoreCreator<S extends IState, C, A, B>(
  state: S,
  computed?: IMapStateToComputed<Readonly<S>, C>,
  actions?: IMapStateToActions<S, Readonly<C>, A>,
  boundMethods?: IMapStateToBoundMethods<S, Readonly<C>, B>
): IStoreCreator<S, C, A, B> {
  let currentState: S;

  return function createStore(initialState?: S): IStoreInstance<S, C, A, B> {
    const callbacks = new Set();

    const stateInfo = {
      ref: Object.assign({}, state, initialState || {}),
      version: 0
    };

    currentState = createStateProxy(stateInfo.ref, key => {
      stateInfo.version += 1;

      callbacks.forEach(cb => {
        cb(currentState, key);
      });
    });

    const readOnlyState = createReadonlyStateProxy(stateInfo.ref);

    const computedGetters = computed ? computed(readOnlyState) : {};

    const memoizedComputed: C = Object.keys(
      computedGetters
    ).reduce((sum: any, key: string) => {
      let lastSeenVersion = -1;
      let cached: any;

      Object.defineProperty(sum, key, {
        set() {
          throw new Error(`Cannot modify computed object. ${key}`);
        },

        get() {
          return () => {
            if (lastSeenVersion === stateInfo.version) {
              return cached;
            }

            cached = (computedGetters as any)[key]();
            lastSeenVersion = stateInfo.version;

            return cached;
          };
        },
        enumerable: true
      });

      return sum;
    }, {});

    return Object.assign(
      {
        state: readOnlyState,
        computed: memoizedComputed,

        onChange(cb: IChangeCallback<S>): void {
          callbacks.add(cb);
        },

        offChange(cb: IChangeCallback<S>): void {
          callbacks.delete(cb);
        }
      },
      actions ? actions(currentState, memoizedComputed) : {},
      boundMethods ? boundMethods(readOnlyState, memoizedComputed) : {}
    );
  };
}
