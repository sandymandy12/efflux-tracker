/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2021 - https://www.igorski.nl
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
import { WAV } from "@/definitions/file-types";

/**
 * Renders the audio represented by given buffer to a HTMLCanvasDrawable image
 *
 * @param {AudioBuffer} buffer
 * @param {String} color
 * @param {number=} width of the resulting PNG image
 * @param {number=} height of the resulting PNG image
 * @returns {HTMLCanvasElement}
 */
export const bufferToWaveForm = ( buffer, color, width = 400, height = 150 ) => {
    const canvas  = document.createElement( "canvas" );
    const ctx     = canvas.getContext( "2d" );
    canvas.width  = width;
    canvas.height = height;

    ctx.fillStyle = color;

    // TODO: render all channels ?
    const data = buffer.getChannelData( 0 );
    const step = Math.ceil( data.length / width );
    const amp  = height / 2;

    for ( let i = 0; i < width; ++i ) {
        let min = 1.0;
        let max = -1.0;
        for ( var j = 0; j < step; ++j ) {
            const datum = data[( i * step ) + j ];
            if ( datum < min ) {
                min = datum;
            } else if ( datum > max ) {
                max = datum;
            }
        }
        ctx.fillRect( i, ( 1 + min ) * amp, 1, Math.max( 1, ( max - min ) * amp ));
    }
    return canvas;
};

/**
 * Slices given Buffer for given range into a new Buffer.
 * Returns null when an invalid range was requested.
 *
 * @param {AudioContext} audioContext
 * @param {AudioBuffer} buffer
 * @param {Number} begin
 * @param {Number} end
 * @returns {AudioBuffer|null}
 */
export const sliceBuffer = ( audioContext, buffer, begin, end ) => {
    const { duration, numberOfChannels, sampleRate } = buffer;

    if ( begin < 0 || end > duration ) {
        return null;
    }
    const startOffset = sampleRate * begin;
    const endOffset   = sampleRate * end;
    const frameCount  = endOffset - startOffset;

    let outputBuffer = null;

    try {
        outputBuffer = audioContext.createBuffer( numberOfChannels, frameCount, sampleRate );
        const tempChannel = new Float32Array( frameCount );
        let offset = 0;

        for ( let channel = 0; channel < numberOfChannels; ++channel ) {
            buffer.copyFromChannel( tempChannel, channel, startOffset );
            outputBuffer.copyToChannel( tempChannel, channel, offset );
        }
    } catch {
        return null;
    }
    return outputBuffer;
};

/**
 * Exports given buffer to a WAV file
 *
 * @param {AudioBuffer} buffer
 * @returns {Blob}
 */
export const bufferToWAV = buffer => {
    const channelAmount = buffer.numberOfChannels;
    const length        = ( buffer.length * channelAmount * 2 ) + 44;
    const outputBuffer  = new ArrayBuffer( length );
    const view          = new DataView( outputBuffer );
    const channels      = [];

    let offset = 0;
    let pos    = 0;

    function setUint16( data ) {
        view.setUint16( pos, data, true );
        pos += 2;
    }

    function setUint32( data ) {
        view.setUint32( pos, data, true );
        pos += 4;
    }

    // write WAVE header
    setUint32( 0x46464952 );                         // "RIFF"
    setUint32( length - 8 );                         // file length - 8
    setUint32( 0x45564157 );                         // "WAVE"

    setUint32( 0x20746d66 );                         // "fmt " chunk
    setUint32( 16 );                                 // length = 16
    setUint16( 1 );                                  // PCM (uncompressed)
    setUint16( channelAmount );
    setUint32( buffer.sampleRate );
    setUint32( buffer.sampleRate * 2 * channelAmount ); // avg. bytes/sec
    setUint16( channelAmount * 2 );                    // block-align
    setUint16( 16 );                                      // 16-bit

    setUint32( 0x61746164 );                         // "data" - chunk
    setUint32( length - pos - 4 );                   // chunk length

    // write interleaved data
    for ( let i = 0; i < channelAmount; i++ ) {
        channels.push( buffer.getChannelData( i ));
    }

    while( pos < length ) {
        // write channels interleaved
        for ( let i = 0; i < channelAmount; i++ ) {
            // clamp sample with -1 to +1 range
            let sample = Math.max( -1, Math.min( 1, channels[ i ][ offset ]));
            // convert to 16-bit signed value
            sample = ( 0.5 + sample < 0 ? sample * 32768 : sample * 32767 ) | 0;
            view.setInt16( pos, sample, true );
            pos += 2;
        }
        offset++;
    }
    return new Blob([ outputBuffer ], { type: WAV });
};
