
# BeautySelectorAddon

---

this mod export addon:

`BeautySelectorAddon` : `BeautySelectorAddon`


## **⚠警告：**
此插件与 `ImageLoaderHook` 冲突，使用时**绝对不要**同时在 `addonPlugin` 中声明使用 `ImageLoaderHook` 

this addon conflict with `ImageLoaderHook`, when use this addon, never to write `ImageLoaderHook` in `boot.json`


```json lines
{
  "imgFileList": [
    // the image files , write as origin path , this addon will auto select it
    // 在这里放图片文件，写DoL游戏的原始图片路径即可，这个Addon会自动根据选择的美化版本选择使用哪个mod中的图片
  ],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^1.0.0",
      "params": {
        // example  "type": "beeesss"
        "type": "YourBeautyType",
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

