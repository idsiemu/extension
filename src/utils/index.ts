export const keysToCamel = (o: any): any => {
    if (Array.isArray(o)) {
      return o.map((i) => keysToCamel(i));
    }
    if (typeof o === 'object' && o !== null) {
      const n: any = {};
      Object.keys(o).forEach((k) => {
        const isUpperCase = k === k.toUpperCase(); // This excludes screaming snake case
        if (!isUpperCase) {
          n[toCamel(k)] = keysToCamel(o[k]);
        } else {
          n[k] = keysToCamel(o[k]);
        }
      });
      return n;
    }
    return o;
  };

  export const toCamel = (s: string): string => s.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
