@echo off
echo Creating Voucher System shortcut...

:: Create the shortcut
powershell "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%USERPROFILE%\Desktop\Voucher System.lnk'); $SC.TargetPath = 'http://192.168.1.215:3000'; $SC.Save()"

echo Shortcut created successfully!
echo You can now double-click the "Voucher System" icon on your desktop to open the system.
pause 