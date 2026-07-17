use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    /// Encrypted attention quality inputs (no raw artifacts).
    /// - quiz_score: 0–100
    /// - artifact_len_bucket: 0–10 (e.g. floor(artifact_len / 40), capped)
    pub struct AttentionInput {
        quiz_score: u8,
        artifact_len_bucket: u8,
    }

    /// Revealed only after MPC: pass bit + coarse band (not raw score).
    /// score_band: 0=<60, 1=60–74, 2=75–89, 3=90–100
    pub struct ThresholdResult {
        passed: u8,
        score_band: u8,
    }

    /// Confidential Proof of Attention threshold.
    /// Hardcoded min score 60; requires non-empty artifact bucket.
    #[instruction]
    pub fn verify_attention_threshold(
        input_ctxt: Enc<Shared, AttentionInput>,
    ) -> Enc<Shared, ThresholdResult> {
        let input = input_ctxt.to_arcis();
        let min_score: u8 = 60;

        let passed: u8 =
            if input.quiz_score >= min_score && input.artifact_len_bucket >= 1 {
                1u8
            } else {
                0u8
            };

        let score_band: u8 = if input.quiz_score < 60 {
            0u8
        } else if input.quiz_score < 75 {
            1u8
        } else if input.quiz_score < 90 {
            2u8
        } else {
            3u8
        };

        input_ctxt.owner.from_arcis(ThresholdResult {
            passed,
            score_band,
        })
    }
}
