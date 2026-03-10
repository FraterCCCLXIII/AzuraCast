<template>
    <modal
        id="contact_modal"
        ref="$modal"
        size="md"
        title="Get in Touch"
    >
        <div class="contact-body">
            <p class="mb-4">
                We welcome messages from listeners, collaborators, and fellow travelers.
                Whether you have a question, want to share your story, or wish to
                contribute &mdash; reach out. We read every message.
            </p>

            <div class="contact-email-block d-flex align-items-center gap-3">
                <span
                    class="contact-icon"
                    aria-hidden="true"
                >
                    <icon-ic-mail />
                </span>
                <div>
                    <div class="small text-muted mb-1">
                        Email
                    </div>
                    <!-- Email address is assembled client-side to protect against harvesting bots -->
                    <a
                        class="contact-email-link fw-semibold"
                        :href="emailHref"
                        @click.stop
                    >
                        {{ emailDisplay }}
                    </a>
                </div>
            </div>

            <p class="small text-muted mt-4 mb-0">
                Tiruvannamalai Radio is a labor of love maintained by a small,
                dedicated team. We aim to reply within a few days.
            </p>
        </div>
    </modal>
</template>

<script setup lang="ts">
import Modal from "~/components/Common/Modal.vue";
import {computed, useTemplateRef} from "vue";
import {useHasModal} from "~/functions/useHasModal.ts";
import IconIcMail from "~icons/ic/baseline-mail";

const $modal = useTemplateRef('$modal');
const {show: open} = useHasModal($modal);

/*
 * The email address is built at runtime from parts so that static scrapers
 * and crawlers cannot harvest it from the source HTML or JS bundle.
 */
const emailParts = ['moderntelepathy', '@', 'gmail', '.', 'com'];
const emailDisplay = computed(() => emailParts.join(''));
const emailHref = computed(() => `mailto:${emailParts.join('')}`);

defineExpose({
    open
});
</script>

<style scoped lang="scss">
.contact-body {
    line-height: 1.75;
}

.contact-icon {
    font-size: 1.5rem;
    color: var(--bs-primary);
    flex-shrink: 0;
}

.contact-email-link {
    color: var(--bs-body-color);
    text-decoration: none;
    border-bottom: 1px dashed var(--bs-primary);
    transition: color 0.2s, border-color 0.2s;

    &:hover,
    &:focus {
        color: var(--bs-primary);
        border-bottom-style: solid;
    }
}
</style>
