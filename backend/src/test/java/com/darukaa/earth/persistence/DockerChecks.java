package com.darukaa.earth.persistence;

import java.util.concurrent.TimeUnit;

final class DockerChecks {

    private DockerChecks() {}

    public static boolean available() {
        try {
            Process process =
                    new ProcessBuilder("docker", "info").redirectErrorStream(true).start();
            boolean finished = process.waitFor(8, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception ex) {
            return false;
        }
    }
}
