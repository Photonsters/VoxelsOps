@ECHO off
cmd /c 

REM https://www.codeproject.com/Tips/123810/Get-user-input-from-DOS-prompt
REM http://steve-jansen.github.io/guides/windows-batch-scripting/part-2-variables.html
REM https://ss64.com/nt/set.html
REM https://ss64.com/nt/if.html
REM https://stackoverflow.com/questions/10552812/declaring-and-using-a-variable-in-windows-batch-file-bat (be careful with spaces)

SET /P _source=Please enter source File (PNG) name: || Set _source=empty
SET /P _destination=Please enter destination (Folder) name: || Set _destination=empty
SET /P _layers=Number of total Layers?: || Set _layers=empty

ECHO %_source% %_destination% %_layers%

REM If any of the pompts are empty call help
IF "%_source%"=="empty" GOTO Help
IF "%_layer%"=="empty" GOTO Help
REM If destination is missing use defaults
IF "%_destination%"=="empty" GOTO SZ


:SDZ
node new.js -s %_source% -d %_destination% -z %_layers%
GOTO End

:SZ
node new.js -s %_source% -z %_layers%
GOTO End

:Help
node new.js -h
GOTO End

:End
cmd /k 


