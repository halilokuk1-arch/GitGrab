Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "msedge --app=" & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\index.html", 0, False