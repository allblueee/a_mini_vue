const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
}

export const PublicInstanceProxyHandlers =
{
    get({ _: instance }, key) {
        // 从 setupstate 获取值
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }

        const publicGetter = publicPropertiesMap[key];
        if(publicGetter){
            return publicGetter(instance)
        }
    }
}