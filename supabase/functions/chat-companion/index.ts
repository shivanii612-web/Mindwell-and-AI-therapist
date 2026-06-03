import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, history } = await req.json();

    // Crisis keywords detection
    const crisisKeywords = [
      "kill myself",
      "suicide",
      "end my life",
      "want to die",
      "hurt myself",
      "self-harm",
    ];

    const isCrisis = crisisKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );

    if (isCrisis) {
      const crisisResponse = `I notice you might be going through a difficult time. Please know that:

- You're not alone
- It's okay to seek help
- Professional support is available

If you're experiencing a crisis, please reach out:
- National Crisis Hotline: 988
- Crisis Text Line: Text HOME to 741741
- Or contact emergency services

Would you like to talk to a licensed therapist?`;

      return new Response(JSON.stringify({ response: crisisResponse, isCrisis: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate supportive response based on sentiment
    const responses = {
      supportive: [
        "I hear you, and I'm here for you. Would you like to explore what's been on your mind?",
        "Thank you for sharing that with me. It takes courage to express your feelings.",
        "I appreciate you opening up. Let's work through this together.",
        "I understand this is challenging. What would help you feel more supported right now?",
      ],
      encouraging: [
        "You're doing great by taking care of your mental health.",
        "Remember, every step forward counts, no matter how small.",
        "Your feelings are valid, and you have the strength to work through this.",
        "You've shown resilience before, and you can do it again.",
      ],
      neutral: [
        "That's an interesting thought. Would you like to explore it further?",
        "I'm here to listen and support you. What's on your mind?",
        "Let's talk about whatever feels important to you right now.",
      ],
    };

    // Simple sentiment detection
    const negativeWords = ["sad", "depressed", "anxious", "worried", "scared", "angry", "frustrated", "stressed", "overwhelmed"];
    const positiveWords = ["happy", "good", "great", "better", "wonderful", "excited", "grateful"];

    const lowerMessage = message.toLowerCase();
    const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
    const hasPositive = positiveWords.some(word => lowerMessage.includes(word));

    let responseCategory = "neutral";
    if (hasNegative && !hasPositive) {
      responseCategory = "supportive";
    } else if (hasPositive && !hasNegative) {
      responseCategory = "encouraging";
    }

    const categoryResponses = responses[responseCategory as keyof typeof responses];
    const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

    return new Response(JSON.stringify({ response, isCrisis: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
