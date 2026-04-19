#!/usr/bin/env bash
set -euo pipefail

readonly registry="ghcr.io/neoplasmes/qualification_work"
readonly source_repository="https://github.com/neoplasmes/qualification_work"

if [[ "$#" -ne 1 ]]; then
  echo "Syntax: $0 <path to dockerfile>" >&2

  exit 1
fi

image_dir="${1%/}"

if [[ -z "${image_dir}" || "${image_dir}" = /* || "${image_dir}" == *".."* || ! -d "${image_dir}" ]]; then
  echo "error: ${1}" >&2

  exit 1
fi

dockerfile="${image_dir}/Dockerfile"

if [[ ! -f "${dockerfile}" ]]; then
  echo "no dockerfile: ${dockerfile}" >&2

  exit 1
fi

image_name="${image_dir//\//_}"
image="${registry}/${image_name}:custom"

docker build --progress=tty \
  -f "${dockerfile}" \
  -t "${image}" \
  --label "org.opencontainers.image.source=${source_repository}" \
  --push \
  .
