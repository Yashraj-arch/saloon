$conns = Get-NetTCPConnection -LocalPort 8005, 5173 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
    $pids = $conns.OwningProcess | Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -gt 4) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}
