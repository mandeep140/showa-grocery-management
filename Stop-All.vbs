Set WshShell = CreateObject("WScript.Shell")

WshShell.Run "cmd /c taskkill /f /fi ""WINDOWTITLE eq Showa*"" >nul 2>&1 & for /f ""tokens=2"" %a in ('netstat -ano ^| findstr "":9823 :9824 :24034""') do taskkill /f /pid %a >nul 2>&1", 0, True