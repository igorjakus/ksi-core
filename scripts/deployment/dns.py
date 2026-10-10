"""Create preview CNAMEs; restricted Cloudflare token supplied by CI environment."""
import argparse
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path
from deploy import branch_slug


def request(path, method='GET', body=None):
    req = urllib.request.Request('https://api.cloudflare.com/client/v4/' + path,
        data=json.dumps(body).encode() if body is not None else None, method=method,
        headers={'Authorization': 'Bearer ' + os.environ['CLOUDFLARE_DNS_TOKEN'], 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as response:
        value = json.load(response)
    if not value.get('success'):
        raise RuntimeError('Cloudflare DNS operation failed')
    return value['result']


def configure(branch, target):
    if branch == 'master':
        return  # Existing production DNS is a bootstrap responsibility.
    if not target or '://' in target or '/' in target:
        raise ValueError('PREVIEW_DNS_TARGET must be an origin hostname')
    zone = os.environ['CLOUDFLARE_ZONE_ID']
    slug = branch_slug(branch)
    for app in ['web', 'api', 'auth', 'dash', 'ws']:
        name = f'{slug}-{app}.ksi.edu.pl'
        path = 'zones/' + zone + '/dns_records'
        records = request(path + '?name=' + urllib.parse.quote(name))
        body = {'type': 'CNAME', 'name': name, 'content': target, 'ttl': 1, 'proxied': True, 'comment': 'KSI preview ' + slug}
        if records:
            if len(records) != 1 or records[0].get('comment') != 'KSI preview ' + slug:
                raise ValueError('Refusing to replace an unmanaged DNS record')
            request(path + '/' + records[0]['id'], 'PUT', body)
        else:
            request(path, 'POST', body)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--branch', required=True)
    args = parser.parse_args()
    configure(args.branch, os.environ.get('PREVIEW_DNS_TARGET', ''))
