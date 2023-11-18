
# BeautySelectorAddon

---

this mod export addon:

`BeautySelectorAddon` : `BeautySelectorAddon`


## **⚠警告：**
此插件与 `ImageLoaderHook` 冲突，在不使用 *兼容模式* 时 **不要** 同时在 `addonPlugin` 中声明使用 `ImageLoaderHook` 

#### `ImageLoaderHook` 兼容模式

在 `params` 下添加 `imgFileList` 字段，可以让 `BeautySelectorAddon` 与 `ImageLoaderHook` 兼容。  
此时 `BeautySelectorAddon`只会读取 `params` 中 `imgFileList` 字段内的图片，而不会读取boot对象根上的`imgFileList` 字段。   

此时 `BeautySelectorAddon` 使用 `params` 中 `imgFileList`， `ImageLoaderHook` 使用 `boot` 对象根上的 `imgFileList`， 故两个Addon不会冲突。

此兼容模式专门设计给需要同时使用 `BeautySelectorAddon` 和 `ImageLoaderHook` 的情况使用。 例如复杂的带剧情同时带美化的整合mod。


### 配置格式

```json lines
{
  "imgFileList": [
    // it you want use this `imgFileList`, keep follow `imgFileList` in `addonPlugin` empty
    // the image files , write as origin path , this addon will auto select it
    // 在这里放图片文件，写DoL游戏的原始图片路径即可，这个Addon会自动根据选择的美化版本选择使用哪个mod中的图片
    // 如果想使用这个`imgFileList`，请移除下面的`addonPlugin`中的`imgFileList`，否则，这个`imgFileList`将被忽略
    // 这种情况适用于既想使用`BeautySelectorAddon`又想使用`ImageLoaderHook`的情况
  ],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^1.0.0",
      "params": {
        // example  "type": "beeesss"
        "type": "YourBeautyType",
        "imgFileList": [
          // use this or use above. if this is exist, the above will be ignored, otherwise , remove the `imgFileList` field from `params`
          // the image files , write as origin path , this addon will auto select it
          // 在这里放图片文件，写DoL游戏的原始图片路径即可，这个Addon会自动根据选择的美化版本选择使用哪个mod中的图片
          // 如果要使用这个，上面最外层的imgFileList将会被忽略，否则，请删除这个位于params中的imgFileList字段
          // 这种情况适用于既想使用`BeautySelectorAddon`又想使用`ImageLoaderHook`的情况
        ],
      }
    }
    // !!!!!!! never write ImageLoaderHook, you dont need that !!!!!!!
    //    {
    //      "modName": "ModLoader DoL ImageLoaderHook",
    //      "addonName": "ImageLoaderAddon",
    //      "modVersion": "^2.3.0",
    //      "params": [
    //      ]
    //    }
  ],
  "dependenceInfo": [
    {
      "modName": "BeautySelectorAddon",
      "version": "^1.0.0"
    }
    // !!!!!!! never write ImageLoaderHook, you dont need that !!!!!!!
    //    {
    //      "modName": "ModLoader DoL ImageLoaderHook",
    //      "version": "^2.3.0"
    //    }
  ]
}
```



### 举例


```json lines
{
  "imgFileList": [],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^1.0.0",
      "params": {
        "type": "ACustomBeautyType",
        "imgFileList": [
          "img/aaa.png",
          "img/bbb.png"
        ],
      }
    }
  ],
  "dependenceInfo": [
    {
      "modName": "BeautySelectorAddon",
      "version": "^1.0.0"
    }
  ]
}
```
