export const extend = Object.assign;
export const isObject = (val)=>{
    return val !== null && typeof val ==="object"
}

export const hasChanged = (val, newvalue)=>{
    return !Object.is(val, newvalue)
}