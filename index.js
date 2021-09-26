const downloadButton = document.getElementById('download')

downloadButton.addEventListener('click', () => {

    fetch('http://localhost:4000/haha')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(peaks => {
            console.log('loaded peaks! sample_rate: ' + peaks.sample_rate);

            var wavesurfer = WaveSurfer.create({
                container: '#waveform',
                waveColor: 'violet',
                progressColor: 'purple',
                normalize: true
            });
            // load peaks into wavesurfer.js
            wavesurfer.load('small.mp3', peaks.data);
        })
        .catch((e) => {
            console.error('error', e);
        });
})