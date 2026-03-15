Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptDir & "\~stop_temp.bat"
Set batFile = fso.CreateTextFile(batPath, True)
batFile.WriteLine "@echo off"
batFile.WriteLine "for /f ""tokens=5"" %%a in ('netstat -ano ^| findstr "":9823"" ^| findstr ""LISTENING""') do taskkill /F /T /PID %%a >nul 2>&1"
batFile.WriteLine "for /f ""tokens=5"" %%a in ('netstat -ano ^| findstr "":9824"" ^| findstr ""LISTENING""') do taskkill /F /T /PID %%a >nul 2>&1"
batFile.WriteLine "for /f ""tokens=5"" %%a in ('netstat -ano ^| findstr "":24034"" ^| findstr ""LISTENING""') do taskkill /F /T /PID %%a >nul 2>&1"
batFile.WriteLine "del ""%~f0"""
batFile.Close

WshShell.Run "cmd /c """ & batPath & """", 0, True