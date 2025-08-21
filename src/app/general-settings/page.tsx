import ProtectedRoute from '@/components/auth/protected-route';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GeneralSettings() {
  return (
    <ProtectedRoute>
        <div className="p-8">
            <div className="mx-auto">
                <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Application Configuration</h1>
                    <p className="text-gray-500">
                    Manage global settings for your application.
                    </p>
                </div>
                <Button className='cursor-pointer'>Save Changes</Button>
                </div>

                <div className="space-y-8">
                {/* API Keys Section */}
                {/* <Card className="border-gray-700">
                    <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Settings related to API keys.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="firebase-key">
                        Firebase Server Key
                        </Label>
                        <p className="text-sm text-gray-500">
                        Server key for Firebase Cloud Messaging (FCM) to send push
                        notifications. This setting is not editable from the UI.
                        </p>
                        <Input
                        id="firebase-key"
                        placeholder="Enter Firebase Server Key"
                        className="border-gray-700"
                        disabled // To match the "Not editable" behavior
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="google-maps-key">
                        Google Maps API Key
                        </Label>
                        <p className="text-sm text-gray-500">
                        API key for Google Maps services. This setting is not
                        editable from the UI.
                        </p>
                        <Input
                        id="google-maps-key"
                        placeholder="Enter Google Maps API Key"
                        className="border-gray-700"
                        disabled // To match the "Not editable" behavior
                        />
                    </div>
                    </CardContent>
                </Card> */}

                {/* General Settings Section */}
                <Card className="border-gray-700">
                    <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>
                        Settings related to general application details.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="app-name">
                        Application Name
                        </Label>
                        <p className="text-sm text-gray-500">
                        The official name of the application, used in titles and
                        communications.
                        </p>
                        <Input
                        id="app-name"
                        defaultValue="My Awesome App"
                        className="border-gray-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="privacy-url">
                        Privacy Policy URL
                        </Label>
                        <p className="text-sm text-gray-500">
                        Link to the Privacy Policy page.
                        </p>
                        <Input
                        id="privacy-url"
                        defaultValue="https://example.com/privacy"
                        className="border-gray-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="support-email">
                        Support Email
                        </Label>
                        <p className="text-sm text-gray-500">
                        The primary email address for customer support inquiries.
                        </p>
                        <Input
                        id="support-email"
                        type="email"
                        defaultValue="support@example.com"
                        className="border-gray-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="terms-url">
                        Terms of Service URL
                        </Label>
                        <p className="text-sm text-gray-500">
                        Link to the Terms of Service page.
                        </p>
                        <Input
                        id="terms-url"
                        defaultValue="https://example.com/terms"
                        className="border-gray-700"
                        />
                    </div>
                    </CardContent>
                </Card>
                </div>
            </div>
        </div>
    </ProtectedRoute>
  );
}
