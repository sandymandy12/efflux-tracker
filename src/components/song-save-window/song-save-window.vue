/**
* The MIT License (MIT)
*
* Igor Zinken 2020-2021 - https://www.igorski.nl
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
* the Software, and to permit persons to whom the Software is furnished to do so,
* subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
* FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
* COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
* IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
<template>
    <div class="song-save-window">
        <div class="header">
            <h2 v-t="'title'"></h2>
            <button class="close-button"
                    @click="$emit('close')"
            >x</button>
        </div>
        <hr class="divider" />
        <div class="meta-editor">
            <input type="text"
                   v-model="title"
                   ref="titleInput"
                   :placeholder="$t('songTitle')"
                   @focus="handleFocusIn"
                   @blur="handleFocusOut"
                   @keyup.enter="save"
            />
            <input type="text"
                   v-model="author"
                   :placeholder="$t('songAuthor')"
                   @focus="handleFocusIn"
                   @blur="handleFocusOut"
                   @keyup.enter="save"
            />
            <div v-if="dropboxConnected" class="dropbox-form">
                <div class="wrapper input footer">
                    <label v-t="'saveInDropbox'"></label>
                    <toggle-button
                        v-model="saveInDropbox"
                        class="dropbox-toggle"
                        sync
                    />
                </div>
                <template v-if="saveInDropbox">
                    <div class="wrapper input">
                        <input
                            type="text"
                            v-model="folder"
                            class="input-field"
                            :placeholder="$t('folder')"
                            @focus="handleFocusIn"
                            @blur="handleFocusOut"
                        />
                    </div>
                    <p v-t="'folderExpl'" class="expl"></p>
                </template>
            </div>
            <button
                v-t="'save'"
                type="button"
                class="save-button"
                :disabled="!title.length || !author.length || isSaving"
                @click="save"
            ></button>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from "vuex";
import { getCurrentFolder, setCurrentFolder } from "@/services/dropbox-service";
import { ToggleButton } from "vue-js-toggle-button";
import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        ToggleButton,
    },
    data: () => ({
        title: "",
        author: "",
        folder: "",
        saveInDropbox: false,
        isSaving: false,
    }),
    computed: {
        ...mapState([
            "dropboxConnected",
        ]),
        ...mapGetters([
            "activeSong",
        ]),
    },
    mounted() {
        this.title  = this.activeSong.meta.title;
        this.author = this.activeSong.meta.author;
        this.saveInDropbox = this.dropboxConnected;

        this.folder = getCurrentFolder();

        this.$refs.titleInput.focus();
    },
    methods: {
        ...mapMutations([
            "setActiveSongAuthor",
            "setActiveSongTitle",
            "suspendKeyboardService",
            "showNotification",
            "setLoading",
            "unsetLoading"
        ]),
        ...mapActions([
            "saveSongInLS",
            "exportSongToDropbox",
            "validateSong",
        ]),
        /**
         * when typing, we want to suspend the KeyboardController
         * so it doesn't broadcast the typing to its listeners
         */
        handleFocusIn() {
            this.suspendKeyboardService( true );
        },
        /**
         * on focus out, restore the KeyboardControllers broadcasting
         */
        handleFocusOut() {
            this.suspendKeyboardService( false );
        },
        async save() {
            this.isSaving = true;
            try {
                this.setActiveSongAuthor( this.author );
                this.setActiveSongTitle( this.title );
                await this.validateSong( this.activeSong );
                this.setLoading( "save" );
                try {
                    if ( this.saveInDropbox ) {
                        await this.exportSongToDropbox({ song: this.activeSong, folder: this.folder });
                        setCurrentFolder( this.folder );
                    } else {
                        await this.saveSongInLS( this.activeSong );
                    }
                } catch {
                    // TODO would that occur at this point ?
                }
                this.unsetLoading( "save" );
                this.$emit( "close" );
            } catch ( e ) {
                // error popup will have been triggered by validator
            }
            this.isSaving = false;
        },
    },
}
</script>

<style lang="scss" scoped>
@import "@/styles/_mixins";
@import "@/styles/forms";

$width: 450px;

.song-save-window {
    @include editorComponent();
    @include overlay();
    @include noSelect();

    .header h2 {
        margin-left: $spacing-medium;
    }

    @include minWidth( $width ) {
        width: $width;
        height: auto;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    @include minWidthFallback( $width ) {
        @include verticalScrollOnMobile();
    }
}

.save-button:disabled {
    background-color: grey;
}

.meta-editor {
    padding: $spacing-medium;

    input, button {
        display: block;
        width: 95%;
        margin: $spacing-small;
    }
}

.dropbox-form {
    padding: $spacing-medium;
}

.dropbox-toggle {
    margin-left: $spacing-medium;
}

.expl {
    @include smallText();
}
</style>
