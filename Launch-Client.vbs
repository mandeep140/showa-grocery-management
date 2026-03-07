Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

If Not fso.FolderExists(scriptDir & "\logs") Then
    fso.CreateFolder(scriptDir & "\logs")
End If

WshShell.Run "cmd /c cd /d """ & scriptDir & "\client"" && npm run dev > """ & scriptDir & "\logs\client.log""  2>&1", 0, False

WScript.Sleep 3000
WshShell.Run "cmd /c start https://localhost:9823", 0, False