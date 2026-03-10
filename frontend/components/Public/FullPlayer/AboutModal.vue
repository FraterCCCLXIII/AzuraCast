<template>
    <modal
        id="about_modal"
        ref="$modal"
        size="lg"
        title="About Tiruvannamalai Radio"
    >
        <div class="about-manifesto">
            <div class="manifesto-header text-center mb-4">
                <div class="station-emblem mb-3" aria-hidden="true">
                    <span class="emblem-inner">॥</span>
                </div>
                <h3 class="manifesto-title">
                    A New Kind of Radio
                </h3>
                <p class="manifesto-subtitle text-muted">
                    Named after Tiruvannamalai, India &mdash; the sacred hill of fire
                </p>
            </div>

            <div class="manifesto-body">
                <p class="lead">
                    This is not background noise. This is an invitation.
                </p>

                <p>
                    Tiruvannamalai Radio was born from a simple recognition: that sound, when
                    offered with intention, can part the veil of ordinary listening and point
                    the ear inward &mdash; to the silence that holds every note, the awareness
                    that hears before the sound arrives.
                </p>

                <p>
                    Most radio stations tell you what to want. This one reminds you of what
                    you already are.
                </p>

                <h5 class="manifesto-section-title mt-4 mb-2">The Unchanging Beneath the Changing</h5>

                <p>
                    Arunachala, the ancient hill of Tiruvannamalai, has been called the
                    Self-luminous beacon &mdash; not a path <em>toward</em> the Self, but the
                    Self radiating as a mountain. Our teachers, the masters in whose memory
                    this station was made, pointed to that same unmoving truth: beneath every
                    thought, every mood, every wave of circumstance, there is a pure, wordless
                    knowing. Call it Awareness. Call it the Self. Call it the silence between
                    heartbeats. It has never come, and so it can never go.
                </p>

                <p>
                    Music, at its depth, is already that silence wearing rhythm and melody.
                    When we listen this way &mdash; not <em>at</em> music but <em>as</em> the
                    space in which music arises &mdash; every transmission becomes a satsang.
                    Every broadcast becomes a return.
                </p>

                <h5 class="manifesto-section-title mt-4 mb-2">For the Next Generation</h5>

                <p>
                    The next generation inherits a world of infinite scroll and infinite noise.
                    They are the most connected and, at times, the most estranged from themselves.
                    They have been handed every answer except the only question that matters:
                    <em>Who is the one listening?</em>
                </p>

                <p>
                    Tiruvannamalai Radio exists to plant that question like a seed &mdash; in
                    the gap between tracks, in the quiet after a song dissolves, in the hum
                    that lingers when the sound stops. We are not trying to entertain. We are
                    trying to remind.
                </p>

                <p>
                    The next generation is ready. They have grown up sensing the hollowness of
                    performance and the weight of borrowed identities. They are hungry for
                    something real. We offer them the oldest real thing there is: the direct
                    recognition that the witness of all experience is untouched, unharmed,
                    radiant, and present &mdash; right now, in the middle of whatever is
                    happening.
                </p>

                <h5 class="manifesto-section-title mt-4 mb-2">What We Broadcast</h5>

                <ul class="manifesto-list">
                    <li>
                        Music that opens more than it fills &mdash; that leaves room for the
                        silence to speak.
                    </li>
                    <li>
                        Sound drawn from traditions that have pointed inward for millennia,
                        as well as from new voices carrying that ancient recognition.
                    </li>
                    <li>
                        Readings, chants, and spoken word that function not as content to be
                        consumed, but as mirrors to be looked into.
                    </li>
                    <li>
                        Intentional silence. Breath. The pause that is not empty but full.
                    </li>
                </ul>

                <h5 class="manifesto-section-title mt-4 mb-2">In Memory of the Masters</h5>

                <p>
                    This station is made in memory of those who have already given everything &mdash;
                    the teachers who did not merely talk about liberation but lived it so
                    completely that their very presence was a transmission. They pointed not to
                    themselves but always past themselves, to the Self that is everyone&rsquo;s
                    own nature.
                </p>

                <p>
                    We carry that pointing forward. In each frequency, in each carefully chosen
                    note, in the space between every sound: their gift continues.
                </p>

                <div class="manifesto-footer text-center mt-5 pt-3 border-top">
                    <p class="fst-italic text-muted mb-1">
                        &ldquo;The Self is always the Self.&rdquo;
                    </p>
                    <p class="small text-muted">
                        Tiruvannamalai Radio &mdash; Broadcasting the Ever-Present
                    </p>
                </div>
            </div>
        </div>
    </modal>
</template>

<script setup lang="ts">
import Modal from "~/components/Common/Modal.vue";
import {useTemplateRef} from "vue";
import {useHasModal} from "~/functions/useHasModal.ts";

const $modal = useTemplateRef('$modal');
const {show: open} = useHasModal($modal);

defineExpose({
    open
});
</script>

<style scoped lang="scss">
.about-manifesto {
    font-size: 1rem;
    line-height: 1.75;
    color: var(--bs-body-color);

    .station-emblem {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        background: var(--bs-primary);
        opacity: 0.85;

        .emblem-inner {
            font-size: 1.5rem;
            color: #fff;
            line-height: 1;
        }
    }

    .manifesto-title {
        font-weight: 300;
        letter-spacing: 0.04em;
    }

    .manifesto-section-title {
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--bs-primary);
    }

    .manifesto-list {
        padding-left: 1.25rem;

        li {
            margin-bottom: 0.5rem;
        }
    }

    .lead {
        font-size: 1.15rem;
        font-weight: 400;
    }
}
</style>
