'use strict';

import * as Modem from 'docker-modem';
import * as fs from 'fs';
import { Stream, Readable } from 'stream';

import { Image } from './image';
import { ContainerData } from './types/container';

/**
 * Class representing container execution
 */

export class Exec {
  modem: Modem;
  container: Container;
  id: string;
  data: Object = {};

  /**
   * Create an execution
   * @param  {Modem}      modem     Modem to connect to the remote service
   * @param  {Container}  container Container that owns the execution (optional)
   * @param  {string}     id        Id of the execution
   */

  constructor(modem: Modem, container: Container, id: string) {
    this.modem = modem;
    this.container = container;
    this.id = id;
  }

  /**
   * Create an exec instance in a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/create-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the new exec instance
   */
  create(opts?: Object): Promise<Exec> {
    const call = {
      path: `/containers/${this.container.id}/exec?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        200: true,
        201: true,
        404: 'no such container',
        409: 'container is paused',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, conf) => {
        if (err) return reject(err);
        const exec = new Exec(this.modem, this.container, conf.Id);
        exec.data = conf;
        resolve(exec);
      });
    });
  }

  /**
   * Start an exec instance
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/exec-start
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the stream to the execution
   */
  start(opts: any = {}): Promise<Stream> {
    const call = {
      path: `/exec/${this.id}/start?`,
      method: 'POST',
      options: opts,
      isStream: true,
      hijack: opts.hijack,
      openStdin: opts.stdin,
      statusCodes: {
        200: true,
        404: 'no such exec instance',
        409: 'container is paused',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stream: Stream) => {
        if (err) return reject(err);
        resolve(stream);
      });
    });
  }

  /**
   * Resize an exec instance
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/exec-resize
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the result
   */
  resize(opts?: Object): Promise<{}> {
    const call = {
      path: `/exec/${this.id}/resize?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        201: true,
        404: 'no such exec instance',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(null);
      });
    });
  }

  /**
   * Get status of an exec instance
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/exec-inspect
   * The reason why this module isn't called inspect is because that interferes with the inspect utility of node.
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the exec instance
   */
  status(opts?: Object): Promise<Exec> {
    const call = {
      path: `/exec/${this.id}/json?`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such exec instance',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, conf) => {
        if (err) return reject(err);
        const exec = new Exec(this.modem, this.container, conf.Id);
        exec.data = conf;
        resolve(exec);
      });
    });
  }
}

/**
 * Class representing container execution management
 */
export class ExecManager {
  modem: Modem;
  container: Container;

  /**
   * Create an execution
   * @param  {Modem}      modem     Modem to connect to the remote service
   * @param  {Container}  container Container that owns the execution (optional)
   * @param  {string}     id        Id of the execution
   */

  constructor(modem: Modem, container: Container) {
    this.modem = modem;
    this.container = container;
  }

  /**
   * Get a Exec Object
   * @param  {id}         string    ID of the exec
   * @return {Exec}
   */
  get(id: string): Exec {
    return new Exec(this.modem, this.container, id);
  }

  /**
   * Create an exec instance in a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/create-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the new exec instance
   */
  create(opts?: Object): Promise<Exec> {
    const call = {
      path: `/containers/${this.container.id}/exec?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        200: true,
        201: true,
        404: 'no such container',
        409: 'container is paused',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, conf) => {
        if (err) return reject(err);
        const exec = new Exec(this.modem, this.container, conf.Id);
        exec.data = conf;
        resolve(exec);
      });
    });
  }
}

/**
 * Class representing container filesystem
 */
export class ContainerFs {
  modem: Modem;
  container: Container;

  /**
   * Create an container filesystem Object
   * @param  {Modem}      modem     Modem to connect to the remote service
   * @param  {Container}  container Container that owns the filesystem (optional)
   */
  constructor(modem: Modem, container: Container) {
    this.modem = modem;
    this.container = container;
  }

  /**
   * Get the info about the filesystem of the container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/retrieving-information-about-files-and-folders-in-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise returning the info about the filesystem
   */
  info(opts?: Object): Promise<String> {
    const call = {
      path: `/containers/${this.container.id}/archive?`,
      method: 'HEAD',
      isStream: true,
      options: opts,
      statusCodes: {
        200: true,
        404: 'bad request',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, info: string) => {
        if (err) return reject(err);
        resolve(info);
      });
    });
  }

  /**
   * Get a tar archive of a resource in the filesystem of a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/get-an-archive-of-a-filesystem-resource-in-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise returning the result as a stream to the tar file
   */
  get(opts: any = {}): Promise<Stream> {
    const call = {
      path: `/containers/${this.container.id}/archive?path=${opts.path}&`,
      method: 'GET',
      isStream: true,
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stream: Stream) => {
        if (err) return reject(err);
        resolve(stream);
      });
    });
  }

  /**
   * Put an extracted tar archive in the filesystem of a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/extract-an-archive-of-files-or-folders-to-a-directory-in-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise returning the result
   */
  put(file: fs.ReadStream, opts?: Object): Promise<Object> {
    const call = {
      path: `/containers/${this.container.id}/archive?`,
      method: 'PUT',
      options: opts,
      isStream: true,
      file: file,
      statusCodes: {
        200: true,
        400: 'bad request',
        403: 'permission denied',
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, res: Object) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  }
}

/**
 * Class representing a container
 */
export class Container {
  modem: Modem;
  id: string;
  fs: ContainerFs;
  exec: ExecManager;
  Warnings: Array<String> = [];
  data: ContainerData;

  /**
   * Create an container Object
   * @param  {Modem}  modem Modem to connect to the remote service
   * @param  {string} id    Container id
   */
  constructor(modem: Modem, id: string) {
    this.modem = modem;
    this.id = id;
    this.fs = new ContainerFs(this.modem, this);
    this.exec = new ExecManager(this.modem, this);
  }

  /**
   * Get low-level information on a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/inspect-a-container
   * The reason why this module isn't called inspect is because that interferes with the inspect utility of node.
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the container
   */
  status(opts?: Object): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/json?`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, conf) => {
        if (err) return reject(err);
        const container = new Container(this.modem, this.id);
        container.data = conf;
        resolve(container);
      });
    });
  }

  /**
   * Get list of processes (ps) inside a container. Not supported in Windows.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/list-processes-running-inside-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the list of processes
   */
  top(opts?: Object): Promise<Array<Object>> {
    const call = {
      path: `/containers/${this.id}/top?`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, processes: Array<Object>) => {
        if (err) return reject(err);
        resolve(processes);
      });
    });
  }

  /**
   * Get stdout and stderr logs from a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/get-container-logs
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise returning the concatenated logs
   */
  logs(opts?: Object): Promise<Readable> {
    const call = {
      path: `/containers/${this.id}/logs?`,
      method: 'GET',
      options: opts,
      isStream: true,
      statusCodes: {
        101: true,
        200: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, logs: Readable) => {
        if (err) return reject(err);
        resolve(logs);
      });
    });
  }

  /**
   * Get changes on a container's filesystem
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/inspect-changes-on-a-container-s-filesystem
   * @return {Promise}        Promise returning the changes
   */
  changes(): Promise<Array<Object>> {
    const call = {
      path: `/containers/${this.id}/changes?`,
      method: 'GET',
      options: {},
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, changes: Array<Object>) => {
        if (err) return reject(err);
        resolve(changes);
      });
    });
  }

  /**
   * Export the content of a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/export-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the content of the tar file as a stream or as a string
   */
  export(opts: any = {}): Promise<Object> {
    const call = {
      path: `/containers/${this.id}/export?`,
      method: 'GET',
      options: opts,
      isStream: !!opts.stream,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, tarStream: any) => {
        if (err) return reject(err);
        if (!opts.stream) return resolve(tarStream);

        const res = [];
        tarStream.on('data', (chunk) => {
          res.push(chunk.toString());
        });

        tarStream.on('end', () => {
          resolve(res.join(''));
        });
      });
    });
  }

  /**
   * Get the stats of a container, either by a live stream or the current state
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/export-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the stats, in a stream or string
   */
  stats(opts?: Object): Promise<Object> {
    const call = {
      path: `/containers/${this.id}/stats?`,
      method: 'GET',
      options: opts,
      isStream: true,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stats: Object) => {
        if (err) return reject(err);
        resolve(stats);
      });
    });
  }

  /**
   * Resize the TTY for a container. You must restart the container to make the resize take effect.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/resize-a-container-tty
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the response
   */
  resize(opts?: Object): Promise<Object> {
    const call = {
      path: `/containers/${this.id}/resize?`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, res: Object) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  }

  /**
   * Start a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/start-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the container
   */
  start(opts: Object = {}): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/start?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        304: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  /**
   * Stop a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/stop-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the container
   */
  stop(opts?: Object): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/stop?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        304: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  /**
   * Restart a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/restart-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the container
   */
  restart(opts?: Object): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/restart?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  /**
   * Kill a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/kill-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the container
   */
  kill(opts?: Object): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/kill?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  /**
   * Update configuration a container.
   * Docs says you can do it for more than one, but doesn't exaplin how, so let's leave it in only one
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/update-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the container
   */
  update(opts?: Object): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/update?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, warnings: Array<String>) => {
        const container = new Container(this.modem, this.id);
        container.Warnings = warnings;
        if (err) return reject(err);
        resolve(container);
      });
    });
  }

  /**
   * Rename a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/rename-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the container
   */
  rename(opts: Object): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/rename?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        404: 'no such container',
        409: 'name already taken',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  /**
   * Pause a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/pause-a-container
   * @return {Promise}          Promise returning the container
   */
  pause(): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/pause?`,
      method: 'POST',
      options: {},
      statusCodes: {
        204: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  /**
   * Unpause a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/unpause-a-container
   * @return {Promise}          Promise returning the container
   */
  unpause(): Promise<Container> {
    const call = {
      path: `/containers/${this.id}/unpause?`,
      method: 'POST',
      options: {},
      statusCodes: {
        204: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  /**
   * Attach to a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/attach-to-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the container
   */
  attach(opts: any = {}): Promise<Array<Object>> {
    const call = {
      path: `/containers/${this.id}/attach?`,
      method: 'POST',
      isStream: true,
      openStdin: opts.stdin,
      options: opts,
      statusCodes: {
        101: true,
        200: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stream) => {
        if (err) return reject(err);
        resolve([stream, this]);
      });
    });
  }

  /**
   * Attach to a container using websocket.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/attach-to-a-container-websocket
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the stream and the container
   */
  wsattach(opts?: Object): Promise<Array<Object>> {
    const call = {
      path: `/containers/${this.id}/attach/ws?`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stream) => {
        if (err) return reject(err);
        resolve([stream, this]);
      });
    });
  }

  /**
   * Block until a container stops, returning exit code
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/wait-a-container
   * @return {Promise}          Promise returning the exit code
   */
  wait(): Promise<Number> {
    const call = {
      path: `/containers/${this.id}/wait?`,
      method: 'POST',
      options: {},
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, code: number) => {
        if (err) return reject(err);
        resolve(code);
      });
    });
  }

  /**
   * Remove a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/remove-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning nothing
   */
  delete(opts?: Object): Promise<{}> {
    const call = {
      path: `/containers/${this.id}?`,
      method: 'DELETE',
      options: opts,
      statusCodes: {
        204: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err);
        resolve(null);
      });
    });
  }

  /**
   * Commit container into an image
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/create-a-new-image-from-a-container-s-changes
   * @param  {Object}   opts    Query params in the request (optional)
   * @return {Promise}          Promise returning the new image
   */
  commit(opts: any = {}): Promise<Image> {
    opts.container = this.id;

    const call = {
      path: `/commit?`,
      method: 'POST',
      options: opts,
      statusCodes: {
        201: true,
        404: 'no such container',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, res) => {
        if (err) return reject(err);
        resolve(new Image(this.modem, res.Id.replace('sha256:', '')));
      });
    });
  }
}

export default class {
  modem: Modem;

  constructor(modem: Modem) {
    this.modem = modem;
  }

  /**
   * Get a Container Object
   * @param  {id}         string    ID of the container
   * @return {Container}
   */
  get(id: string): Container {
    return new Container(this.modem, id);
  }

  /**
   * Get the list of containers
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/list-containers
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise returning the result as a list of containers
   */
  list(opts?: Object): Promise<Array<Container>> {
    const call = {
      path: '/containers/json?',
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, containers) => {
        if (err) return reject(err);
        resolve(
          containers.map((conf) => {
            const container = new Container(this.modem, conf.Id);
            container.data = conf;
            return container;
          }),
        );
      });
    });
  }

  /**
   * Create a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/create-a-container
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the new container
   */
  create(opts?: Object): Promise<Container> {
    const call = {
      path: '/containers/create?',
      method: 'POST',
      options: opts,
      statusCodes: {
        200: true,
        201: true,
        400: 'bad request',
        404: 'no such image',
        406: 'impossible to attach',
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, conf) => {
        if (err) return reject(err);
        const container = new Container(this.modem, conf.Id);
        container.data = conf;
        resolve(container);
      });
    });
  }

  /**
   * Prune a container
   * https://docs.docker.com/engine/api/v1.25/#operation/ContainerPrune
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}          Promise returning the container
   */
  prune(opts?: Object): Promise<Object> {
    const call = {
      path: `/containers/prune`,
      method: 'POST',
      options: opts,
      statusCodes: {
        200: true,
        500: 'server error',
      },
    };

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, res: Object) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  }
}
