' Sync Dashboard Data
' Runs the MSP -> CSV export with NO visible console window, then tells the user to press Refresh.
' Usage:  wscript.exe Sync-Now.vbs            (normal: shows a short result popup)
'         cscript.exe Sync-Now.vbs quiet      (silent, for testing)
Option Explicit

Dim quiet
quiet = False
If WScript.Arguments.Length > 0 Then
    If LCase(WScript.Arguments(0)) = "quiet" Then quiet = True
End If

Dim sh, fso, here, scriptPath, cmd, rc
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
scriptPath = fso.BuildPath(here, "export-msp-data.ps1")

If Not fso.FileExists(scriptPath) Then
    If Not quiet Then sh.Popup "Sync script not found:" & vbCrLf & scriptPath, 15, "Sync Dashboard Data", 16
    WScript.Quit 2
End If

' 0 = hidden window, so no console ever flashes on screen.
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & scriptPath & """"
rc = sh.Run(cmd, 0, True)

If quiet Then
    WScript.Echo "exit=" & rc
ElseIf rc = 0 Then
    sh.Popup "Data synced from MS Project." & vbCrLf & vbCrLf & "Now click Refresh in Power BI Desktop.", 8, "Sync Dashboard Data", 64
Else
    sh.Popup "Sync FAILED (exit code " & rc & ")." & vbCrLf & vbCrLf & "Details: .freebuff\logs\export-msp-data.log", 20, "Sync Dashboard Data", 16
End If

WScript.Quit rc
