#!/usr/bin/env bash
set -euo pipefail

backup_root=/var/backups/blog-cms
mysql_config=/etc/blog-cms/mysql.cnf
timestamp=$(date -u +%Y%m%dT%H%M%SZ)

install -d -m 0700 "$backup_root"
umask 077
mysqldump --defaults-extra-file="$mysql_config" --single-transaction --routines --triggers blog_cms | gzip -9 > "$backup_root/blog_cms-$timestamp.sql.gz"
find "$backup_root" -maxdepth 1 -type f -name 'blog_cms-*.sql.gz' -mtime +14 -delete
