Set WshShell = CreateObject("WScript.Shell")
projectDir = "D:\IT PROJECT\DuonglendinhSBLT"
WshShell.CurrentDirectory = projectDir

cmd = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command ""$conn = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue; if (!$conn) { Start-Process cmd.exe -ArgumentList '/c npm start' -WorkingDirectory 'D:\IT PROJECT\DuonglendinhSBLT' -WindowStyle Hidden; Start-Sleep -Seconds 3 }; Start-Process 'http://localhost:4000'"""
WshShell.Run cmd, 0, False
