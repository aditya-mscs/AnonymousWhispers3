import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-4">About Anonymous Dark Secrets</h1>
        <p className="text-lg text-muted-foreground">
          A safe space for sharing your deepest thoughts without judgment or identification.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>The simple process of sharing your secrets anonymously</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-medium">Share Your Secret</h3>
              <p className="text-sm text-muted-foreground">
                Type or use voice-to-text to share your secret anonymously.
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-medium">Rate the Darkness</h3>
              <p className="text-sm text-muted-foreground">
                Use the slider to indicate how dark you feel your secret is.
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-medium">Connect with Others</h3>
              <p className="text-sm text-muted-foreground">Read, comment, and share other people's secrets.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What We Do</CardTitle>
          <CardDescription>Our mission and values</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Anonymous Dark Secrets provides a platform for people to express their deepest thoughts, regrets, and
            confessions without fear of judgment or identification. We believe in the therapeutic power of sharing
            burdens that weigh on your mind.
          </p>
          <p>
            Our platform is designed to be a safe space where users can find relief through anonymous expression while
            also connecting with others who may have similar experiences.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Privacy</CardTitle>
          <CardDescription>How we protect your anonymity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <strong>We do not store personal information.</strong> While we use IP addresses as identifiers in our
            database for technical purposes, we never connect this to personally identifiable information.
          </p>
          <p>
            Your username is randomly generated and stored only in your browser's local storage. Voice recordings are
            never stored - they're only used to convert to text in real-time.
          </p>
          <p>
            We employ strict security measures to ensure your secrets remain anonymous and the platform remains free
            from abuse.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Enhancements</CardTitle>
          <CardDescription>What's coming next</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Community support features for those seeking help</li>
            <li>Enhanced filtering options for finding relevant secrets</li>
            <li>Themed collections of secrets</li>
            <li>Mobile app for easier sharing on the go</li>
            <li>Optional anonymous messaging between users</li>
            <li>Integration with mental health resources for those who need support</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

