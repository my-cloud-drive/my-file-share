@echo off
title System Alert
color 0c

:: Create a temporary VBScript file to generate the popup
echo x=msgbox("Unidentified IP address detected. System files are being encrypted.", 0+16, "Security Warning") > %tmp%\popup.vbs

:: Run the VBScript
cscript //nologo %tmp%\popup.vbs

:: Delete the temporary file
del %tmp%\popup.vbs

echo Access Denied.
pause