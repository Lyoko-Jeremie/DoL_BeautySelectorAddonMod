
# 这是 type2 的范例

```json lines
{
  "additionDir": [
    "TypeB",  // 打包 TypeB 目录下的所有文件
    "TypeC"
  ],
  "addonPlugin": [
    {
      "modName": "BeautySelectorAddon",
      "addonName": "BeautySelectorAddon",
      "modVersion": "^2.0.0",
      "params": {
        "types": [
          {     //  这是一个美化类型
            "type": "TypeB",
            "imgFileListFile": "TypeB/files.json"   // 设置美化的根文件夹下的图片列表文件，这里的路径是相对于 boot.json 的路径
          },
          {     //  这是另一个美化类型
            "type": "TypeC",
            "imgFileListFile": "TypeC/files.json"
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



以下是其中一个美化的根文件列表json文件（以`TypeC/files.json`举例）：

```json lines
[
  // 以下是图片文件的路径，这个路径是相对于当前json文件所在文件夹的路径，而不是boot.json的路径
  // 例如这个`img/aaa/bbb/ccc/0.png` ， 实际上在zip文件中，因为这个json文件在`TypeC`文件夹下，所以这个图片的路径是`TypeC/img/aaa/bbb/ccc/0.png`
  "img/body/tan/under_upper/bikini/0.png",
  // ...... 其他图片
]
```

