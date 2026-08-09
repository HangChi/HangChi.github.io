import path from 'node:path';

export type RemoteReleaseOptions = {
  host: string;
  port: number;
  user: string;
  identityFile: string;
  knownHostsFile: string;
  root: string;
};

type Command = { executable: string; args: string[] };

function sshArgs(options: RemoteReleaseOptions): string[] {
  return [
    '-p', String(options.port), '-i', options.identityFile,
    '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
    '-o', `UserKnownHostsFile=${options.knownHostsFile}`,
  ];
}

export function remoteActivationCommands(
  options: RemoteReleaseOptions,
  localDist: string,
  releaseName: string,
): { prepare: Command; rsync: Command; activate: Command } {
  if (!/^[0-9A-Za-z_-]+$/.test(releaseName)) throw new Error('Unsafe release name');
  if (!path.posix.isAbsolute(options.root) || !/^[\w./-]+$/.test(options.root)) throw new Error('Unsafe remote root');
  if (!/^[\w.-]+$/.test(options.host) || !/^[\w-]+$/.test(options.user)) throw new Error('Unsafe remote target');
  const target = path.posix.join(options.root, 'releases', releaseName);
  const temporary = path.posix.join(options.root, `.current-${releaseName}`);
  const current = path.posix.join(options.root, 'current');
  const destination = `${options.user}@${options.host}`;
  const ssh = sshArgs(options);
  const transport = ['ssh', ...ssh].join(' ');
  return {
    prepare: { executable: 'ssh', args: [...ssh, destination, `mkdir -p -- ${target}`] },
    rsync: {
      executable: 'rsync',
      args: ['-az', '--delete', '-e', transport, `${path.resolve(localDist)}${path.sep}`, `${destination}:${target}/`],
    },
    activate: {
      executable: 'ssh',
      args: [...ssh, destination, `ln -s -- ${target} ${temporary} && mv -Tf -- ${temporary} ${current}`],
    },
  };
}
