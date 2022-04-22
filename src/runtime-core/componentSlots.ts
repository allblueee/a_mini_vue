import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
    // instance.slots = Array.isArray(children) ? children : [children]
    const {vnode}=instance;
    if(vnode.shapeFlags&ShapeFlags.SLOT_CHILDREN){
        normalizeObjectSlots(children, instance.slots);
    }
}

function normalizeObjectSlots(children: any, slots: any) {
    for (const key in children) {
        const value = children[key]
        slots[key] = (props)=>normalizeSlotsValue(value(props))
    }
}

function normalizeSlotsValue(value) {
    return Array.isArray(value) ? value : [value];
}