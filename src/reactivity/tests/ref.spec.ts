import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, proxyRefs, ref, unRef } from "../ref";

describe("ref", () => {
    it("happy path", () => {
        const a = ref(1);
        expect(a.value).toBe(1);
    });

    it("should be reactive", ()=>{
        const a = ref(1)
        let dummy;
        let calls = 0;
        effect(()=>{
            calls++;
            dummy = a.value;
        })
        expect(calls).toBe(1)
        expect(dummy).toBe(1)
        a.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
        // 相同值 不应该触发 trigger
        a.value = 2
        expect(calls).toBe(2);
        expect(dummy).toBe(2)
    })

    it("should make nested properties reactive", ()=>{
        const a = ref({
            count:1,
        });
        let dummy;
        effect(()=>{
            dummy = a.value.count
        })
        expect(dummy).toBe(1);
        a.value.count = 2;
        expect(dummy).toBe(2);
    })

    it("isRef", ()=>{
        const a = ref(1)
        const user = reactive({
            age: 1
        })
        expect(isRef(a)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(user)).toBe(false)
    })
    it("unRef", ()=>{
        // 返回 ref 对象的value值
        // 如果不是 ref对象，就返回本身
        const a = ref(1)
        expect(unRef(a)).toBe(1)
        expect(unRef(1)).toBe(1)
    })

    it("proxyRefs", () => {
        const user = {
            age: ref(10),
            name: "xiaohong",
        };
        // 对 ref 对象进行代理，不需要写 .value 就可以访问值
        // get 对象时，如果是 ref 类型，返回 .value 否则返回原值
        // set 对象时，如果是 ref 类型，对 .value 修改
        const proxyUser = proxyRefs(user);
        expect(user.age.value).toBe(10)
        expect(proxyUser.age).toBe(10);
        expect(proxyUser.name).toBe("xiaohong")

        proxyUser.age = 20;

        expect(proxyUser.age).toBe(20);
        expect(user.age.value).toBe(20);

        proxyUser.age = ref(15);
        expect(proxyUser.age).toBe(15);
        expect(user.age.value).toBe(15);
    })
})
