import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", ()=>{
    // computed 缓存
    it("happy path", ()=>{
        const user = reactive({
            age: 1,
        })

        const age = computed(()=>{
            return user.age;
        })

        expect(age.value).toBe(1);
    })

    it("should computed lazily", ()=>{
        const value = reactive({
            foo: 1,
        });

        const getter = jest.fn(() =>{
            return value.foo
        })

        const cValue = computed(getter);

        expect(getter).not.toHaveBeenCalled();
        
        expect(cValue.value).toBe(1)
        expect(getter).toHaveBeenCalledTimes(1);

        // // // should not computed again 
        cValue.value;
        expect(getter).toHaveBeenCalledTimes(1);

        // // // should not conputed until needed
        value.foo = 2;
        expect(getter).toHaveBeenCalledTimes(1);


        // // /// now it should compute
        expect(cValue.value).toBe(2);
        expect(getter).toHaveBeenCalledTimes(2)

        // // // should not computed again 
        cValue.value;
        expect(getter).toHaveBeenCalledTimes(2);
    })
})