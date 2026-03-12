import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

type OnboardingEmailProps = {
  name: string;
  setupUrl: string;
};

const OnboardingEmail = ({ name, setupUrl }: OnboardingEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Worshpr – Set Up Your Account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Worshpr</Heading>
          <Text style={{ ...text, textAlign: 'left' }}>Hi {name},</Text>
          <Text style={{ ...text, textAlign: 'justify' }}>
            You&apos;ve been added to the Worshpr Worship Media Team Portal. To
            get started, please set up your password by clicking the link below:
          </Text>
          <Link href={setupUrl} style={button}>
            Set Up Your Password
          </Link>
          <Text style={text}>
            This link will expire in 24 hours for security reasons.
          </Text>
          <Text style={footer}>
            If you did not expect this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OnboardingEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Inter", sans-serif',
};

const container = {
  padding: '40px 20px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 20px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '16px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '20px auto',
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '40px 0 0',
};
