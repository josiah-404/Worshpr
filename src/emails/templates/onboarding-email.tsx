import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
  Hr,
} from '@react-email/components';

interface OnboardingEmailProps {
  name: string;
  setupUrl: string;
}

export function OnboardingEmail({ name, setupUrl }: OnboardingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Set up your EMBR account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Worshpr</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Your account has been created. Click the button below to set up your
            password and access the Worship Media Team Portal.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={setupUrl} style={button}>
              Set Up Your Password
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in 7 days for security reasons.
          </Text>
          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={footer}>
            If you did not expect this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: 'Inter, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '40px',
  borderRadius: '8px',
  maxWidth: '520px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 16px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
};

const footer = {
  color: '#9ca3af',
  fontSize: '13px',
  lineHeight: '1.5',
};
