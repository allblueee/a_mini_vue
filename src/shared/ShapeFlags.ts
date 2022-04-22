// 公共的判断类型
export const enum ShapeFlags {
    Element = 1,
    STATEFUL_COMPONENT = 1 << 1,
    TEXT_CHILDREN = 1 << 2,
    ARRAY_CHILDREN = 1 << 3,
    SLOT_CHILDREN = 1 << 4,
}