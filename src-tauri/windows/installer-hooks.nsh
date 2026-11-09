; Folio: always create a desktop shortcut after install (including reinstall /update).
; Tauri's default shortcut step skips creation when $UpdateMode=1.
!macro NSIS_HOOK_POSTINSTALL
  SetShellVarContext current
  IfFileExists "$INSTDIR\${MAINBINARYNAME}.exe" 0 folio_skip_desktop
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0
  folio_skip_desktop:
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  SetShellVarContext current
  Delete "$DESKTOP\${PRODUCTNAME}.lnk"
!macroend
