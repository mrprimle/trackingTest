async function setupCamera() {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.play();
            resolve(video);
        };
    });
}

async function loadBodyPix() {
    const net = await bodyPix.load();
    return net;
}

async function init() {
    const video = await setupCamera();
    const net = await loadBodyPix();

    video.addEventListener('loadeddata', () => {
        segmentBody(video, net);
    });
}

async function segmentBody(video, net) {
    const segmentation = await net.segmentPerson(video, {
        flipHorizontal: false,
        internalResolution: 'medium',
        segmentationThreshold: 0.7,
    });

    const arSkin = document.getElementById('ar-skin');

    // Example: Move the AR skin to follow the person's body (head position)
    const personHeight = 1.6; // Assuming an average height of 1.6 meters
    const headPosition = getHeadPosition(segmentation);
    if (headPosition) {
        arSkin.setAttribute('position', {
            x: headPosition.x,
            y: personHeight,
            z: -headPosition.y,
        });
    }

    requestAnimationFrame(() => segmentBody(video, net));
}

function getHeadPosition(segmentation) {
    const { data, width, height } = segmentation;
    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            if (data[index] === 1) { // Person detected
                sumX += x;
                sumY += y;
                count++;
            }
        }
    }

    if (count > 0) {
        return {
            x: (sumX / count) / width * 2 - 1,
            y: (sumY / count) / height * 2 - 1,
        };
    }

    return null;
}

init();
