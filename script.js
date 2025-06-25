document.addEventListener('DOMContentLoaded', () => {
    const audio = new Audio();
    let currentSongIndex = 0;
    let songs = []; // Se llenará después

    // Elementos del DOM
    const albumArt = document.getElementById('album-art');
    const songTitle = document.getElementById('song-title');
    const songArtist = document.getElementById('song-artist');
    const prevButton = document.getElementById('prev-button');
    const playPauseButton = document.getElementById('play-pause-button');
    const nextButton = document.getElementById('next-button');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const playlistElement = document.getElementById('playlist');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const shuffleButton = document.getElementById('shuffle-button');
    const repeatButton = document.getElementById('repeat-button');
    const searchInput = document.getElementById('search-input');

    let isShuffleActive = false;
    let repeatMode = 0; // 0: no repeat, 1: repeat one, 2: repeat all
    let originalPlaylistOrder = []; // Para restaurar el orden después de shuffle
    let filteredSongs = []; // Para la búsqueda

    // Canciones de ejemplo (reemplazar con URLs reales o archivos locales)
    // Para que esto funcione localmente, necesitarás tener archivos de audio
    // en una carpeta (por ejemplo, 'music') y referenciarlos correctamente.
    // También necesitarás imágenes para las carátulas.
    // Por ahora, usaremos placeholders y URLs de audio de ejemplo si es posible,
    // o dejaremos que el usuario las configure.

    // *** IMPORTANTE PARA EL USUARIO ***
    // Debes reemplazar 'path/to/your/song.mp3' y 'path/to/your/image.jpg'
    // con las rutas correctas a tus archivos de audio e imágenes.
    // Si no tienes archivos locales, puedes buscar URLs de audio de ejemplo
    // (asegúrate de que permitan la reproducción directa).
    let masterSongsList = [ // Renombrado para claridad
        {
            title: "Nombre de tu Canción 1",
            artist: "Artista 1",
            src: "audio/song1.mp3", // Ejemplo: "music/sample1.mp3"
            art: "img/image1.jpg"    // Ejemplo: "images/cover1.jpg"
        },
        {
            title: "Nombre de tu Canción 2",
            artist: "Artista 2",
            src: "audio/song2.mp3", // Ejemplo: "music/sample2.mp3"
            art: "img/image2.jpg"    // Ejemplo: "images/cover2.jpg"
        },
        {
            title: "Nombre de tu Canción 3",
            artist: "Artista 3",
            src: "audio/song3.mp3", // Ejemplo: "music/sample3.mp3"
            art: "img/image3.jpg"    // Ejemplo: "images/cover3.jpg"
        }
        // Añade más canciones aquí
    ];

    // Inicializa la lista de canciones actual y la lista filtrada
    songs = [...masterSongsList];
    filteredSongs = [...masterSongsList];
    originalPlaylistOrder = [...masterSongsList];


    function loadSong(songIndex, playImmediately = false) {
        const currentSongs = searchInput.value ? filteredSongs : songs;

        if (currentSongs.length === 0) {
            songTitle.textContent = "Sin canciones";
            songArtist.textContent = "Añade canciones o ajusta el filtro";
            albumArt.src = "placeholder.jpg";
            audio.src = ""; // Limpiar fuente de audio
            updateProgress(); // Asegura que la UI se reinicie
            playPauseButton.textContent = "Reproducir";
            return;
        }

        // Asegurarse de que el índice es válido para la lista actual
        if (songIndex < 0) songIndex = currentSongs.length - 1;
        if (songIndex >= currentSongs.length) songIndex = 0;

        currentSongIndex = songIndex; // Actualizar el índice global crucialmente aquí

        const song = currentSongs[currentSongIndex];
        if (!song) { // Verificación adicional
            console.error("Intento de cargar una canción indefinida en el índice:", currentSongIndex);
            return;
        }

        songTitle.textContent = song.title;
        songArtist.textContent = song.artist;
        albumArt.src = song.art || "placeholder.jpg";
        audio.src = song.src;

        updatePlaylistUI();
        if (playImmediately) {
            playSong();
        }
    }

    function playSong() {
        const currentSongs = searchInput.value ? filteredSongs : songs;
        if (currentSongs.length === 0 || !audio.src) return; // Verificar si hay src
        audio.play()
            .then(() => playPauseButton.textContent = "Pausar")
            .catch(error => console.error("Error al reproducir:", error));
    }

    function pauseSong() {
        audio.pause();
        playPauseButton.textContent = "Reproducir";
    }

    function prevSong() {
        const currentSongs = searchInput.value ? filteredSongs : songs;
        if (currentSongs.length === 0) return;

        let newIndex = currentSongIndex - 1;
        if (newIndex < 0) {
            newIndex = currentSongs.length - 1;
        }
        loadSong(newIndex, true);
    }

    function nextSongLogic() { // Renombrado para evitar conflicto de nombres
        const currentSongs = searchInput.value ? filteredSongs : songs;
        if (currentSongs.length === 0) return;

        if (isShuffleActive) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * currentSongs.length);
            } while (currentSongs.length > 1 && randomIndex === currentSongIndex); // Evitar repetir la misma canción si hay más de una
            loadSong(randomIndex, true);
        } else {
            let newIndex = currentSongIndex + 1;
            if (newIndex >= currentSongs.length) {
                newIndex = 0; // Vuelve al inicio de la lista (filtrada o no)
            }
            loadSong(newIndex, true);
        }
    }


    function handleSongEnd() {
        const currentSongs = searchInput.value ? filteredSongs : songs;
        if (repeatMode === 1) { // Repetir canción actual
            audio.currentTime = 0;
            playSong();
        } else if (repeatMode === 2 && currentSongIndex === currentSongs.length - 1 && !isShuffleActive) { // Repetir lista y es la última canción (y no shuffle)
            loadSong(0, true);
        } else if (currentSongIndex < currentSongs.length - 1 || isShuffleActive || repeatMode === 2) { // Si no es la última, o shuffle está activo, o se repite lista
            nextSongLogic();
        } else { // Fin de la lista, no repetir, no shuffle
            pauseSong();
            audio.currentTime = 0; // Opcional: reiniciar la canción actual
            progressBar.value = 0; // Reiniciar barra de progreso
            // Podrías querer cargar la primera canción sin reproducirla: loadSong(0);
        }
    }


    function updateProgress() {
        if (audio.duration && audio.src) { // Asegurarse que hay un src cargado
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progressBar.value = progressPercent;
            currentTimeDisplay.textContent = formatTime(audio.currentTime);
            durationDisplay.textContent = formatTime(audio.duration);
        } else {
            progressBar.value = 0;
            currentTimeDisplay.textContent = "0:00";
            durationDisplay.textContent = "0:00";
        }
            progressBar.value = 0;
            currentTimeDisplay.textContent = "0:00";
            // durationDisplay no se cambia aquí para evitar que parpadee "NaN" si no hay duración
        }
    }

    function setProgressFromInput() {
        const currentSongs = searchInput.value ? filteredSongs : songs;
        if (currentSongs.length === 0 || !audio.duration) return;
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function populatePlaylist(songsToDisplay) {
        playlistElement.innerHTML = ''; // Limpiar lista actual
        if (songsToDisplay.length === 0) {
            const li = document.createElement('li');
            li.textContent = searchInput.value ? "No hay coincidencias." : "No hay canciones en la lista.";
            li.style.textAlign = "center";
            li.style.color = "#888";
            playlistElement.appendChild(li);
            return;
        }
        songsToDisplay.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title} - ${song.artist}`;
            // Al hacer clic, usamos el índice original de la canción en la lista 'songs' o 'filteredSongs'
            li.addEventListener('click', () => {
                // Encontrar el índice correcto en la lista 'songs' (no filtrada si shuffle está activo)
                // o en 'filteredSongs' si hay una búsqueda.
                const listToUse = searchInput.value ? filteredSongs : songs;
                const actualSongIndexInList = listToUse.findIndex(s => s.src === song.src && s.title === song.title);

                if (actualSongIndexInList !== -1) {
                    loadSong(actualSongIndexInList, true);
                } else {
                    // Fallback si la canción no se encuentra (debería ser raro)
                    // Podríamos intentar cargarla directamente si 'song' es un objeto completo
                    console.warn("Canción no encontrada en la lista actual después del clic.");
                }
            });
            playlistElement.appendChild(li);
        });
        updatePlaylistUI();
    }

    function updatePlaylistUI() {
        const listItems = playlistElement.querySelectorAll('li');
        // La canción activa siempre se basa en `songs[currentSongIndex]`,
        // que es la lista de reproducción subyacente (barajada o no).
        // `filteredSongs` es solo para la visualización de la lista.

        if (songs.length === 0 || currentSongIndex < 0 || currentSongIndex >= songs.length) {
             listItems.forEach(item => item.classList.remove('active'));
             return;
        }

        const actualCurrentSong = songs[currentSongIndex]; // La canción que realmente está cargada/sonando

        listItems.forEach(item => {
            // Para marcar como activo, el elemento <li> debe corresponder a actualCurrentSong
            // Y estar visible en la lista filtrada actual.
            const itemText = item.textContent;
            const isMatch = itemText === `${actualCurrentSong.title} - ${actualCurrentSong.artist}`;

            if (isMatch) {
                // Verificar si esta canción (actualCurrentSong) está en filteredSongs
                const isInFilteredList = filteredSongs.some(fs => fs.src === actualCurrentSong.src && fs.title === actualCurrentSong.title);
                if (searchInput.value && !isInFilteredList) {
                    // Si hay un filtro y la canción actual no está en él, no se resalta nada en la lista visible.
                    item.classList.remove('active');
                } else {
                    // Si no hay filtro, o si hay filtro y la canción está en él.
                    item.classList.add('active');
                }
            } else {
                item.classList.remove('active');
            }
        });
    }

    function setVolume() {
        audio.volume = volumeSlider.value;
        if (audio.volume === 0) {
            volumeIcon.textContent = "🔇";
        } else if (audio.volume < 0.5) {
            volumeIcon.textContent = "🔉";
        } else {
            volumeIcon.textContent = "🔊";
        }
    }

    function toggleShuffle() {
        isShuffleActive = !isShuffleActive;
        shuffleButton.classList.toggle('active', isShuffleActive);

        isShuffleActive = !isShuffleActive;
        shuffleButton.classList.toggle('active', isShuffleActive);

        const currentGlobalSong = songs[currentSongIndex];

        if (isShuffleActive) {
            // Guardar el orden de la lista 'songs' (que es la lista maestra o la ya barajada si se activa/desactiva shuffle múltiples veces)
            originalPlaylistOrder = [...songs];
            // Barajar 'songs'
            songs.sort(() => Math.random() - 0.5);
            // Encontrar la canción actual en la nueva lista barajada y actualizar currentSongIndex
            const newIdx = songs.findIndex(s => s.src === currentGlobalSong.src && s.title === currentGlobalSong.title);
            if (newIdx !== -1) currentSongIndex = newIdx;

        } else {
            // Restaurar 'songs' al último estado guardado en originalPlaylistOrder
            // (que debería ser el orden de masterSongsList si shuffle se activó una vez sobre la lista original)
            // o el orden que tenía antes de la última activación de shuffle.
            // Para asegurar que siempre volvemos al orden maestro original:
            songs = [...masterSongsList];
            // Encontrar la canción actual en la lista restaurada (orden maestro)
            const newIdx = songs.findIndex(s => s.src === currentGlobalSong.src && s.title === currentGlobalSong.title);
            if (newIdx !== -1) currentSongIndex = newIdx;
            else if (songs.length > 0) currentSongIndex = 0; // Fallback si no se encuentra
        }

        // Actualizar la lista visual (playlistElement)
        // Si hay una búsqueda activa, la lista visual (filteredSongs) no cambia por shuffle/unshuffle.
        // Si no hay búsqueda, la lista visual (songs) ha cambiado.
        populatePlaylist(searchInput.value ? filteredSongs : songs);
        updatePlaylistUI();
    }

    function toggleRepeat() {
        repeatMode = (repeatMode + 1) % 3; // 0, 1, 2
        switch (repeatMode) {
            case 0: // No repetir
                repeatButton.textContent = "🔁";
                repeatButton.classList.remove('active');
                repeatButton.title = "Repetir desactivado";
                break;
            case 1: // Repetir una
                repeatButton.textContent = "🔂";
                repeatButton.classList.add('active');
                repeatButton.title = "Repetir canción actual";
                break;
            case 2: // Repetir todas
                repeatButton.textContent = "🔁"; // Mismo icono pero activo
                repeatButton.classList.add('active'); // Podríamos usar un estilo diferente si es necesario
                repeatButton.title = "Repetir lista";
                break;
        }
    }

    function filterSongs() {
        const searchTerm = searchInput.value.toLowerCase();
        if (!searchTerm) {
            filteredSongs = isShuffleActive ? [...songs] : [...originalPlaylistOrder]; // Usa la lista 'songs' barajada o la original
        } else {
            // Filtrar desde la lista maestra (masterSongsList) para obtener siempre resultados consistentes
            // independientemente del estado de shuffle de 'songs'.
            filteredSongs = masterSongsList.filter(song =>
                song.title.toLowerCase().includes(searchTerm) ||
                song.artist.toLowerCase().includes(searchTerm)
            );
        }

        const currentGlobalSongObject = songs[currentSongIndex]; // La canción que está sonando o estaba sonando

        populatePlaylist(filteredSongs); // Actualizar la UI de la lista primero

        let newVisualIndexInFilteredList = -1;
        if (currentGlobalSongObject) { // Si había una canción sonando
            newVisualIndexInFilteredList = filteredSongs.findIndex(s => s.src === currentGlobalSongObject.src && s.title === currentGlobalSongObject.title);
        }

        if (newVisualIndexInFilteredList !== -1) {
            // La canción actual sigue en la lista filtrada, actualizamos el resaltado.
            // No cambiamos currentSongIndex global aquí, ya que se refiere a la lista 'songs'.
            // La UI se actualizará para mostrar la canción correcta como activa si está visible.
        } else if (filteredSongs.length > 0) {
            // La canción actual no está en el filtro, pero hay otras canciones.
            // No cambiamos la canción que suena ni el currentSongIndex global.
            // Simplemente la canción activa no será visible en la lista filtrada.
            // El usuario puede seguir escuchándola y los controles seguirán funcionando sobre ella.
            // Si el usuario hace clic en una nueva canción de la lista filtrada, entonces se cambiará.
        } else if (filteredSongs.length === 0) {
            // No hay resultados en el filtro.
            // No cambiamos la canción que está sonando.
            // Si el usuario borra el filtro, la canción actual (si estaba sonando) volverá a aparecer resaltada.
            // Si queremos pausar cuando no hay resultados:
            // pauseSong();
            // songTitle.textContent = "Sin coincidencias";
            // songArtist.textContent = "";
            // albumArt.src = "placeholder.jpg";
            // updateProgress();
        }
        updatePlaylistUI(); // Llama para asegurar que el resaltado sea correcto según la lógica anterior
    }


    // Event Listeners
    playPauseButton.addEventListener('click', () => {
        const currentSongs = searchInput.value ? filteredSongs : songs;
        if (currentSongs.length === 0 && masterSongsList.length > 0 && !searchInput.value) {
            // Si no hay canciones en la lista actual (ej. por filtro) pero sí en la maestra,
            // y no hay filtro activo, cargar la primera de la maestra.
            loadSong(0, true); // Carga y reproduce la primera
            return;
        }
        if (currentSongs.length === 0) return;

        const isPlaying = audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2;
        if (isPlaying) {
            pauseSong();
        } else {
            // Si audio.src está vacío (ej. después de un filtro sin resultados), cargar la canción actual
            if (!audio.src && currentSongs[currentSongIndex]) {
                 loadSong(currentSongIndex, true);
            } else if (audio.src) {
                 playSong();
            }
        }
    });

    prevButton.addEventListener('click', prevSong);
    nextButton.addEventListener('click', nextSongLogic); // Usar la nueva lógica para siguiente

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleSongEnd); // Manejador de fin de canción mejorado
    audio.addEventListener('loadedmetadata', updateProgress); // Actualizar duración cuando se carga

    progressBar.addEventListener('input', setProgressFromInput);
    volumeSlider.addEventListener('input', setVolume);
    shuffleButton.addEventListener('click', toggleShuffle);
    repeatButton.addEventListener('click', toggleRepeat);
    searchInput.addEventListener('input', filterSongs);


    // Carga inicial
    setVolume(); // Establecer volumen inicial y icono
    populatePlaylist(songs); // Usar 'songs' que puede estar barajada o no
    if (songs.length > 0) {
        loadSong(currentSongIndex, false); // Carga la primera canción pero no la reproduce
    } else {
        songTitle.textContent = "Sin canciones";
        songArtist.textContent = "Añade canciones a la lista";
        albumArt.src = "placeholder.jpg";
        currentTimeDisplay.textContent = "0:00";
        durationDisplay.textContent = "0:00";
        progressBar.value = 0;
        playPauseButton.textContent = "Reproducir";
    }
    updatePlaylistUI(); // Asegurar que la UI de la playlist se actualice al inicio
});
