Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")


scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

If Not fso.FolderExists(scriptDir & "\logs") Then
    fso.CreateFolder(scriptDir & "\logs")
End If

WshShell.Run "cmd /c cd /d """ & scriptDir & "\backend"" && node server.js > """ & scriptDir & "\logs\backend.log"" 2>&1", 0, False

WScript.Sleep 2000

WshShell.Run "cmd /c cd /d """ & scriptDir & "\admin"" && npm run dev > """ & scriptDir & "\logs\admin.log"" 2>&1", 0, False

WScript.Sleep 3000
WshShell.Run "cmd /c start http://localhost:9824", 0, False
