
# BeautySelectorAddon

---

this mod export addon:

`BeautySelectorAddon` : `BeautySelectorAddon`

---

BeautySelectorAddon 的设计目的是无冲突地添加多套重复的美化，范围可以覆盖到整个游戏内所有原始图像

the design purpose of BeautySelectorAddon is to add multiple sets of duplicate beautification without conflict, and the scope can cover all original images in the game


此插件有三种运行模式：
1. 模式0： 原版兼容模式，只有一套美化的模式，这个模式下，`addonPlugin[BeautySelectorAddon].params.type` 这个字段必须存在 ，   
   且 `addonPlugin[BeautySelectorAddon].params.imgFileList` 字段不能存在。   
   不能使用 ImageLoaderHook 插件，需要在 `addonPlugin[BeautySelectorAddon].params.type` 上填写美化类型   
   此模式下本mod不能与 ImageLoaderHook 共同使用，否则会出现问题，因为本mod只会处理 ImageLoaderHook 无法处理的图片加载请求。   
   **这是个兼容模式，如果可能，请不要使用这个模式。**   
2. 模式1： 只有一套美化的模式   
   如果 `addonPlugin[BeautySelectorAddon].params.imgFileList` 字段存在且是个数组，则意味着会运行在模式1下   
3. 模式2： 多套美化的模式   
   如果需要使用这个模式，上面的type字段和imgFileList字段必须不存在   

this addon has three run mode:
1. mode 0: original compatible mode, only one set of beautification mode, in this mode, 
   `addonPlugin[BeautySelectorAddon].params.type` this field must exist,   
   and `addonPlugin[BeautySelectorAddon].params.imgFileList` field cannot exist.   
   Cannot use the ImageLoaderHook plugin, need to fill in the beautification type on `addonPlugin[BeautySelectorAddon].params.type`   
   This mod cannot be used with ImageLoaderHook at the same time in this mode, 
   otherwise problems will occur, because this mod will only process image loading requests that ImageLoaderHook cannot process.   
   **This is a compatibility mode, if possible, please do not use this mode.**
2. mode 1: only one set of beautification mode   
   If the `addonPlugin[BeautySelectorAddon].params.imgFileList` field exists and is an array, it means that it will run in mode 1
3. mode 2: multiple sets of beautification mode   
   If you need to use this mode, the above type field and imgFileList field must not exist




### 配置格式

```json lines
{
  "imgFileList": [
    // 模式0： 原版兼容模式，只有一套美化的模式，这个模式下，这个字段必须存在。
    //   不能使用 ImageLoaderHook 插件，需要在 addonPlugin[BeautySelectorAddon].params.type 上填写美化类型
    //   此模式下本mod不能与 ImageLoaderHook 共同使用，否则会出现问题，因为本mod只会处理 ImageLoaderHook 无法处理的图片加载请求
    "img/aaa.png",
    "img/bbb.png"
  ],
  "additionBinaryFile": [
    // 如果要使用打包器，在模式1、2下，需要把用到的图片文件路径加入这个字段，打包器会自动把这些文件打包到zip中，这里不要列出imgFileList出现的文件
    // ... 下面引用到的所有文件的完整路径，注意这里是相对与zip根目录的路径
    "typeA/imgFileListFileA.json",
    "typeA/img/aaa.png",
    "typeA/img/bbb.png",
    "typeB/imgFileListFileB.json",
    "typeB/img/aaa.png",
    "typeB/img/bbb.png",
  ],
  "additionDir": [
    // 也可以不使用 additionBinaryFile ，转而使用 additionDir 让打包器包含指定的整个目录下所有文件
    "typeA",
    "typeB"
  ],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^2.0.0",
      "params": {
        // 模式1： 只有一套美化的模式
        "type": "YourBeautyType",     //  <=== 你的美化类型，在模式0、1下必须填写
        "imgFileList": [    //  <=== 如果这个字段存在且是个数组，则意味着会运行在模式1下
          // the image files , write as origin path , this addon will auto select it
          // 在这里放图片文件，写DoL游戏的原始图片路径即可，这个Addon会自动根据选择的美化版本选择使用哪个mod中的图片
          // 这里的路径就是zip中的路径，记得将文件路径加入 additionBinaryFile
          "img/aaa.png",
          "img/bbb.png"
        ],
        // 模式2： 多套美化的模式
        // 如果需要使用这个模式，上面的type字段和imgFileList字段必须不存在
        "types": [
          {
            "type": "TypeA",
            "imgFileListFile": "typeA/imgFileListFileA.json",  // 一个文件，里面是一个数组，数组中的每个元素是一个图片文件的路径
          },
          {
            "type": "TypeB",
            "imgFileListFile": "typeB/imgFileListFileB.json",
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


#### type0:

```json lines
{
  "imgFileList": [
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
        // "imgFileList": [],   // <======= this not exist
      }
    }
  ],
  "dependenceInfo": [
    {
      "modName": "BeautySelectorAddon",
      "version": "^2.0.0"
    }
    //  在type0模式下，不能使用 ImageLoaderHook
    //    {
    //      "modName": "ModLoader DoL ImageLoaderHook",
    //      "version": "^2.3.0"
    //    }
  ]
}
```

```
root--+
      |-boot.json
      |-img---+
              |-aaa.png
              |-bbb.png
```

#### type1:

```json lines
{
  "imgFileList": [
    // 下面出现了的图片不要放这里，这里的图片给 ImageLoaderHook 使用
    // dont place here if the image file is placed in follow, this place are used by ImageLoaderHook
  ],
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

```
root--+
      |-boot.json
      |-img---+
              |-aaa.png
              |-bbb.png
```

#### type2:

type2 分 A / B 两种写法，具体见下

```json lines
{
  "imgFileList": [
    // 下面出现了的图片不要放这里，这里的图片给 ImageLoaderHook 使用
    // don't place here if the image file is placed in follow, this place are used by ImageLoaderHook
  ],
  "additionBinaryFile": [
    // 可以使用 additionBinaryFile 列出所有文件
    "typeA/imgFileListFileA.json",
    "typeA/img/aaa.png",
    "typeA/img/bbb.png",
    "typeB/imgFileListFileB.json",
    "typeB/img/aaa.png",
    "typeB/img/bbb.png",
  ],
  "additionDir": [
    // 也可以使用 additionDir 包含指定的整个目录下所有文件
    "typeA",
    "typeB",
    
    "typeC"
  ],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^2.0.0",
      "params": {
        "types": [
          // type2A
          {
            "type": "TypeA",
            "imgFileListFile": "typeA/imgFileListFileA.json",
          },
          {
            "type": "TypeB",
            "imgFileListFile": "typeB/imgFileListFileB.json",
          },
          // type2B
          // 特别地，提供一种不需要编写 imgFileListFile.json 的方式
          // 使用 `imgDir` 而不是 `imgFileListFile` 来指定图片根目录，这样会自动扫描目录下的所有文件并索引为图片
          // 请注意，在这种情况下，这个目录下的所有文件都会被打包到zip中，并在浏览器请求时读取并加载其中的任何文件到内存，所以请不要放不属于图片的文件，或不需要使用的文件
          {
            "type": "TypeC",
            "imgDir": "typeC/path/to/dir",
          }
          // 请注意， `imgFileListFile` 与 `imgDir` 二选一， 不能同时存在
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

imgFileListFile.json :

```json lines
[  
  // 相对路径，相对于此文件所在目录的路径
  // relative path , relative to this file's directory
  "img/aaa.png",
  "img/bbb.png",
  // ... 和游戏原始图片路径一样的路径
]
```

```
root---+
       |-boot.json
       |
       |-typeA---+
       |         |-imgFileListFileA.json 
       |         |-img---+
       |                 |-aaa.png
       |                 |-bbb.png
       |
       |
       |-typeB---+
       |         |-imgFileListFileB.json 
       |         |-img---+
       |                 |-aaa.png
       |                 |-bbb.png
       |-typeC---+
       |         |-path-+
       |                |-to-+
       |                     |-dir-+
       |                           |-aaa.png
       |                           |-bbb.png
       |                           |-ccc.png
       |

```
