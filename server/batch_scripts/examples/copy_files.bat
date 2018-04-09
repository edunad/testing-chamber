@echo off
XCOPY "%ROOT%\copy_extraconfigs" %DEPLOY_LOCATION% /F /Y /E
exit /b %errorlevel%
