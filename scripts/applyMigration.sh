#!/usr/bin/env bash

set -euo pipefail

job_file="${1:-}"
sql_dir="${2:-}"

job_name=""
namespace=""
configmap_name=""
configmap_count=0

if [ "$#" -eq 2 ] && [ -f "$job_file" ]; then
  job_name="$(kubectl create --dry-run=client --validate=false -f "$job_file" -o jsonpath='{.metadata.name}' 2>/dev/null || true)"
  namespace="$(kubectl create --dry-run=client --validate=false -f "$job_file" -o jsonpath='{.metadata.namespace}' 2>/dev/null || true)"
  configmap_name="$(kubectl create --dry-run=client --validate=false -f "$job_file" -o jsonpath='{range .spec.template.spec.volumes[?(@.configMap.name)]}{.configMap.name}{"\n"}{end}' 2>/dev/null || true)"
  configmap_count="$(printf '%s\n' "$configmap_name" | wc -w | tr -d ' ')"
fi

if [ "$#" -ne 2 ] || [ ! -f "$job_file" ] || [ ! -d "$sql_dir" ] || [ -z "$job_name" ] || [ -z "$namespace" ] || [ "$configmap_count" -ne 1 ]; then
  {
    echo "invalid configuration"
    echo "Check:"
    echo "- exactly two arguments are passed: job file path and SQL directory path"
    echo "- job file exists"
    echo "- SQL directory exists"
    echo "- job metadata.name is set"
    echo "- job metadata.namespace is set"
    echo "- job has exactly one configMap volume for SQL files"
  } >&2
  exit 1
fi

kubectl -n "$namespace" delete job "$job_name" --ignore-not-found --wait=true

kubectl -n "$namespace" create configmap "$configmap_name" \
  --from-file="$sql_dir" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

kubectl apply -f "$job_file"
kubectl -n "$namespace" wait --for=condition=complete "job/$job_name" --timeout=-1s
kubectl -n "$namespace" logs "job/$job_name"
kubectl -n "$namespace" delete configmap "$configmap_name" --ignore-not-found
