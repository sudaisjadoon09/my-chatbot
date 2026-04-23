$envFile = '.env'
if (-not (Test-Path $envFile)) { Write-Output 'HTTP 0'; Write-Output 'ERROR: .env not found'; exit 1 }
$line = Get-Content $envFile | Where-Object { $_ -match '^\s*OPENROUTER_API_KEY\s*=' } | Select-Object -First 1
if (-not $line) { Write-Output 'HTTP 0'; Write-Output 'ERROR: OPENROUTER_API_KEY not found in .env'; exit 1 }
$key = ($line -replace '^\s*OPENROUTER_API_KEY\s*=\s*','').Trim()
$key = $key.Trim('"').Trim("'")
if ([string]::IsNullOrWhiteSpace($key)) { Write-Output 'HTTP 0'; Write-Output 'ERROR: OPENROUTER_API_KEY is empty'; exit 1 }
$headers = @{ Authorization = "Bearer $key"; 'Content-Type' = 'application/json'; 'HTTP-Referer' = 'http://localhost'; 'X-Title' = 'my-chatbot' }
$bodyObj = @{ model = 'meta-llama/llama-3.1-8b-instruct:free'; messages = @(@{ role='user'; content='hello' }) }
$body = $bodyObj | ConvertTo-Json -Depth 6
try {
  $resp = Invoke-WebRequest -Uri 'https://openrouter.ai/api/v1/chat/completions' -Method Post -Headers $headers -Body $body -UseBasicParsing
  Write-Output ("HTTP {0}" -f [int]$resp.StatusCode)
  $json = $resp.Content | ConvertFrom-Json
  $text = $json.choices[0].message.content
  if (-not $text) { $text = $json.choices[0].text }
  if ($text) {
    $short = ($text -replace '\s+',' ').Trim()
    if ($short.Length -gt 160) { $short = $short.Substring(0,160) + '...' }
    Write-Output ("TEXT: {0}" -f $short)
  } else {
    Write-Output 'ERROR: No text in first choice'
  }
} catch {
  $status = 0
  $msg = $_.Exception.Message
  if ($_.Exception.Response) {
    try { $status = [int]$_.Exception.Response.StatusCode } catch {}
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $errBody = $reader.ReadToEnd()
      if ($errBody) {
        $parsed = $errBody | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($parsed.error.message) { $msg = $parsed.error.message } else { $msg = $errBody }
      }
    } catch {}
  }
  Write-Output ("HTTP {0}" -f $status)
  $msg = ($msg -replace '\s+',' ').Trim()
  if ($msg.Length -gt 200) { $msg = $msg.Substring(0,200) + '...' }
  Write-Output ("ERROR: {0}" -f $msg)
  exit 1
}