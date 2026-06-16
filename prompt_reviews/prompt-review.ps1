$script = Join-Path $PSScriptRoot "prompt-review.py"
python $script @args
exit $LASTEXITCODE
