export function flatten<T>(lista: T[]) { 
    return lista.reduce((a, b) => 
        a.concat(Array.isArray(b) ? flatten(b) : b), []);
}