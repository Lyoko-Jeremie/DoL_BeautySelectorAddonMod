
# BeautySelectorAddon

---

this mod export addon:

`BeautySelectorAddon` : `BeautySelectorAddon`

### 配置格式

```json lines
{
  "additionBinaryFile": [
    // ... 下面imgFileList中引用到的所有文件的完整路径
    "DirTypeA/img/aaa.png",
    "DirTypeA/img/bbb.png",
    "DirTypeB/img/aaa.png",
    "DirTypeB/img/bbb.png",
  ],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^2.0.0",
      "params": {
        // 模式1： 只有一套美化的模式
        "type": "YourBeautyType",
        "imgFileList": [
          // the image files , write as origin path , this addon will auto select it
          // 在这里放图片文件，写DoL游戏的原始图片路径即可，这个Addon会自动根据选择的美化版本选择使用哪个mod中的图片
          // 这里的路径就是zip中的路径，记得将文件路径加入 additionBinaryFile
        ],
        // 模式2： 多套美化的模式
        // 如果存在这个类型列表字段，则上面两个字段( `type` / `imgFileList` )会被忽略
        types: [
          {
            "type": "TypeA",
            "rootDir": "DirTypeA",
            "imgFileList": [
              // ... 和游戏原始图片路径一样的路径，且在zip中的真实文件路径必须是 `rootDir/imgPath` 的格式
              "img/aaa.png",    // 例如此文件在zip中的真实路径必须是 `DirTypeA/img/aaa.png` ，同时对应上面 additionBinaryFile 中的路径
              "img/bbb.png",
            ],
          },
          {
            "type": "TypeB",
            "rootDir": "DirTypeB",
            "imgFileList": [
              // ... 和游戏原始图片路径一样的路径
              "img/aaa.png",
              "img/bbb.png",
            ],
          }
        ]
      }
    }
  ],
  "dependenceInfo": [
    {
      "modName": "BeautySelectorAddon",
      "version": "^2.0.0"
    }
  ]
}
```



### 举例


```json lines
{
  "additionBinaryFile": [
    "img/aaa.png",
    "img/bbb.png"
  ],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^2.0.0",
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
      "version": "^2.0.0"
    }
  ]
}
```

```json lines
{
  "additionBinaryFile": [
    "DirTypeA/img/aaa.png",
    "DirTypeA/img/bbb.png",
    "DirTypeB/img/aaa.png",
    "DirTypeB/img/bbb.png",
  ],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^2.0.0",
      "params": {
        types: [
          {
            "type": "TypeA",
            "rootDir": "DirTypeA",
            "imgFileList": [
              "img/aaa.png",
              "img/bbb.png",
            ],
          },
          {
            "type": "TypeB",
            "rootDir": "DirTypeB",
            "imgFileList": [
              "img/aaa.png",
              "img/bbb.png",
            ],
          }
        ]
      }
    }
  ],
  "dependenceInfo": [
    {
      "modName": "BeautySelectorAddon",
      "version": "^2.0.0"
    }
  ]
}
```
